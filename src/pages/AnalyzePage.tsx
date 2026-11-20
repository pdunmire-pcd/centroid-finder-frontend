import { useEffect, useRef, useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Link,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { Link as RouterLink, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getJobs, getProcessingStatus, getVideoUrl, processVideo, uploadVideo } from '../api'
import { checkFrameQuality } from '../centroid/engine'
import { ColorToolsPanel } from '../components/color/ColorToolsPanel'
import { DistanceHistogram } from '../components/color/DistanceHistogram'
import { DistanceMap } from '../components/color/DistanceMap'
import { ProcessingControls } from '../components/ProcessingControls'
import { AnalyzeViewer, type FrameSnapshot } from '../components/player/AnalyzeViewer'
import { LiveStatsPanel } from '../components/quality/LiveStatsPanel'
import { WarningsPanel } from '../components/quality/WarningsPanel'
import { LocalVideoPicker, VideoDropZone } from '../components/player/LocalVideoPicker'
import { localFileError, localFileWarning } from '../components/player/localVideo'
import type { VideoSource } from '../types'

// Routes:
//   /analyze/:filename  a video on the server (the name is URL-encoded)
//   /analyze/local      a video from the user's computer, passed as
//                       navigate('/analyze/local', { state: { file } })
// Both accept ?color=<hex without #>&threshold=<0-442>, which is how
// "Run again with new settings" on the Job results page opens this page.

const DEFAULT_COLOR = '#ff0000'
const DEFAULT_THRESHOLD = 120

/** Reads ?color=420500&threshold=60, ignoring values that aren't valid. */
function settingsFromUrl(params: URLSearchParams): { color: string | null; threshold: number | null } {
  const rawColor = (params.get('color') ?? '').replace(/^#/, '')
  const color = /^[0-9a-fA-F]{6}$/.test(rawColor) ? `#${rawColor.toLowerCase()}` : null
  const rawThreshold = Number(params.get('threshold'))
  const threshold =
    params.has('threshold') && Number.isInteger(rawThreshold) && rawThreshold >= 0 && rawThreshold <= 442
      ? rawThreshold
      : null
  return { color, threshold }
}

/** The File in the router's history state, if there is one. */
function fileFromState(state: unknown): File | null {
  if (typeof state === 'object' && state !== null && 'file' in state && state.file instanceof File) {
    return state.file
  }
  return null
}

export default function AnalyzePage() {
  // React Router already decodes the URL, so "my%20video.mp4" becomes "my video.mp4".
  // On /analyze/local there is no :filename, so it is undefined.
  const { filename } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [pickError, setPickError] = useState<string | null>(null)

  const localFile = fileFromState(location.state)
  let source: VideoSource | null = null
  if (filename !== undefined) source = { kind: 'server', filename }
  else if (localFile) source = { kind: 'local', file: localFile }

  const openLocalFile = (file: File) => {
    const error = localFileError(file)
    setPickError(error)
    if (error) return
    // File objects can be stored in history state, so the page gets the file
    // without uploading it anywhere.
    navigate('/analyze/local', { state: { file } })
  }

  return (
    <VideoDropZone onFile={openLocalFile}>
      <Stack direction="row" spacing={2} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
        <Button component={RouterLink} to="/videos">
          ← Back to videos
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <LocalVideoPicker onFile={openLocalFile} />
      </Stack>

      {pickError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPickError(null)}>
          {pickError}
        </Alert>
      )}

      {source ? (
        // The key gives every video a fresh session: new trail, new job state.
        <AnalyzeSession
          key={source.kind === 'server' ? `server:${source.filename}` : `local:${location.key}`}
          source={source}
        />
      ) : (
        <OpenLocalVideoPanel onFile={openLocalFile} />
      )}
    </VideoDropZone>
  )
}

/** Shown on /analyze/local without a file, e.g. after a page refresh. */
function OpenLocalVideoPanel({ onFile }: { onFile: (file: File) => void }) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: { xs: 3, sm: 6 }, textAlign: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: 'divider' }}
      data-testid="open-local-panel"
    >
      <Typography variant="h1" gutterBottom>
        Open a video from your computer
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Choose a file or drag it onto this page. It stays on your computer; nothing is uploaded.
      </Typography>
      <LocalVideoPicker onFile={onFile} label="Choose a video" variant="contained" />
    </Paper>
  )
}

/** Player, live analysis and processing for one video. */
function AnalyzeSession({ source }: { source: VideoSource }) {
  const [searchParams] = useSearchParams()
  const fromUrl = settingsFromUrl(searchParams)
  const [threshold, setThresholdState] = useState(fromUrl.threshold ?? DEFAULT_THRESHOLD)
  const [targetColor, setTargetColorState] = useState(fromUrl.color ?? DEFAULT_COLOR)
  // The latest analysed frame, for the color tools and frame check panels.
  const [snapshot, setSnapshot] = useState<FrameSnapshot | null>(null)

  // Once the user changes a setting, we never overwrite it with saved ones.
  const touched = useRef(fromUrl.color !== null || fromUrl.threshold !== null)
  const setThreshold = (value: number) => {
    touched.current = true
    setThresholdState(value)
  }
  const setTargetColor = (value: string) => {
    touched.current = true
    setTargetColorState(value)
  }

  // No settings in the URL? Start from this video's most recent finished run.
  useEffect(() => {
    if (source.kind !== 'server') return
    let cancelled = false
    getJobs()
      .then((jobs) => {
        // getJobs is newest first, so find() gives the latest run of this video
        const last = jobs.find((job) => job.filename === source.filename && job.status === 'done')
        if (cancelled || !last || touched.current) return
        setTargetColorState(`#${last.targetColor.toLowerCase()}`)
        setThresholdState(last.threshold)
      })
      .catch(() => {
        // No job history (e.g. an older server): keep the defaults.
      })
    return () => {
      cancelled = true
    }
  }, [source])
  const [isProcessing, setIsProcessing] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [csvUrl, setCsvUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isLocal = source.kind === 'local'
  const title = source.kind === 'server' ? source.filename : source.file.name
  const src = source.kind === 'server' ? getVideoUrl(source.filename) : source.file
  const sizeWarning = source.kind === 'local' ? localFileWarning(source.file) : null

  const startProcessing = async () => {
    setError(null)
    setCsvUrl(null)
    setJobId(null)
    setStatusMessage('')
    setIsProcessing(true)

    try {
      // A video from this computer has to be on the server before the JAR can
      // process it, so upload it first (with a progress message).
      let serverFilename: string
      if (source.kind === 'local') {
        setStatusMessage('Uploading video… 0%')
        const uploaded = await uploadVideo(source.file, (fraction) =>
          setStatusMessage(`Uploading video… ${Math.round(fraction * 100)}%`),
        )
        serverFilename = uploaded.filename
      } else {
        serverFilename = source.filename
      }

      setStatusMessage('Processing video…')
      const result = await processVideo(serverFilename, targetColor, threshold)
      setJobId(result.jobId)
    } catch (caughtError) {
      setIsProcessing(false)
      setError(caughtError instanceof Error ? caughtError.message : 'Could not start processing')
    }
  }

  // Ask the server every 2 seconds how the job is doing.
  useEffect(() => {
    if (!jobId || !isProcessing) return

    const interval = window.setInterval(async () => {
      try {
        const status = await getProcessingStatus(jobId)

        if (status.status === 'processing') {
          setStatusMessage('Processing video…')
        } else if (status.status === 'done') {
          setCsvUrl(status.result)
          setStatusMessage('')
          setIsProcessing(false)
        } else if (status.status === 'error') {
          setError(status.error)
          setStatusMessage('')
          setIsProcessing(false)
        }
      } catch (caughtError) {
        setIsProcessing(false)
        setError(caughtError instanceof Error ? caughtError.message : 'Could not check processing status')
      }
    }, 2000)

    return () => window.clearInterval(interval)
  }, [jobId, isProcessing])

  const controls = (
    <ProcessingControls
      filename={title}
      threshold={threshold}
      targetColor={targetColor}
      onThresholdChange={setThreshold}
      onTargetColorChange={setTargetColor}
      onProcess={startProcessing}
      isProcessing={isProcessing}
    />
  )

  return (
    <>
      <Typography variant="overline" color="text.secondary" component="p">
        Analyze
      </Typography>
      <Typography variant="h1" sx={{ overflowWrap: 'anywhere', mb: 3 }}>
        {title}
      </Typography>
      {sizeWarning && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {sizeWarning}
        </Alert>
      )}

      <AnalyzeViewer src={src} targetColor={targetColor} threshold={threshold} onSnapshot={setSnapshot} />

      {/* Under the video: settings on the left, checks and color tools on the
          right. Below 900 px the two columns stack, settings first. */}
      <Box
        sx={{
          mt: { xs: 3, md: 4 },
          display: 'grid',
          gap: { xs: 2, md: 3 },
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 5fr) minmax(0, 7fr)' },
          alignItems: 'start',
        }}
      >
        <Box>
          {isLocal && (
            <Alert severity="info" sx={{ mb: 2 }} data-testid="local-upload-note">
              This video is on your computer. Processing uploads it to the server first, then the JAR
              tracks every frame. The live preview above works without uploading.
            </Alert>
          )}
          {controls}

          {statusMessage && (
            <Alert severity="info" role="status" sx={{ mt: 2, width: '100%' }}>
              {statusMessage}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
          {csvUrl && (
            <Alert
              severity="success"
              sx={{ mt: 2, width: '100%' }}
              action={
                jobId && (
                  <Button component={RouterLink} to={`/jobs/${encodeURIComponent(jobId)}`} color="inherit" size="small">
                    View results
                  </Button>
                )
              }
            >
              Processing complete.{' '}
              <Link href={csvUrl} target="_blank" rel="noreferrer">
                Download CSV
              </Link>
            </Alert>
          )}
        </Box>

        <Stack spacing={2} data-testid="analysis-side-panel">
          <Paper component="section" aria-labelledby="frame-check-title" sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography id="frame-check-title" variant="h2" gutterBottom>
              Frame check
            </Typography>
            <LiveStatsPanel analysis={snapshot?.analysis ?? null} />
            <Box sx={{ mt: 2 }}>
              <WarningsPanel warnings={snapshot ? checkFrameQuality(snapshot.analysis) : null} />
            </Box>
          </Paper>

          <Paper component="section" aria-labelledby="color-tools-title" sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography id="color-tools-title" variant="h2" gutterBottom>
              Color tools
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Pause the video to sample the animal on the frame shown below.
            </Typography>
            <ColorToolsPanel
              frame={snapshot?.image ?? null}
              currentTime={snapshot?.time ?? 0}
              filename={title}
              targetColor={targetColor}
              threshold={threshold}
              onTargetColorChange={setTargetColor}
              onThresholdChange={setThreshold}
            />
          </Paper>

          <Accordion variant="outlined" disableGutters>
            <AccordionSummary expandIcon={<span aria-hidden>▾</span>} sx={{ px: { xs: 2, sm: 3 } }}>
              <Typography variant="h3" component="h2">
                How well does this color separate the animal?
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
              <Stack spacing={3}>
                <DistanceHistogram frame={snapshot?.image ?? null} targetColor={targetColor} threshold={threshold} />
                <DistanceMap frame={snapshot?.image ?? null} targetColor={targetColor} threshold={threshold} />
              </Stack>
            </AccordionDetails>
          </Accordion>
        </Stack>
      </Box>
    </>
  )
}

/** The old /preview/:filename route now goes to the Analyze page. */
export function PreviewRedirect() {
  const { filename = '' } = useParams()
  return <Navigate to={`/analyze/${encodeURIComponent(filename)}`} replace />
}
