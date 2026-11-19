import { useEffect, useState } from 'react'
import { Alert, Box, Button, Link, Paper, Stack, Tooltip, Typography } from '@mui/material'
import { Link as RouterLink, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getProcessingStatus, getVideoUrl, processVideo } from '../api'
import { ProcessingControls } from '../components/ProcessingControls'
import { AnalyzeViewer } from '../components/player/AnalyzeViewer'
import { LocalVideoPicker, VideoDropZone } from '../components/player/LocalVideoPicker'
import { localFileError, localFileWarning } from '../components/player/localVideo'
import type { VideoSource } from '../types'

// Routes:
//   /analyze/:filename  a video on the server (the name is URL-encoded)
//   /analyze/local      a video from the user's computer, passed as
//                       navigate('/analyze/local', { state: { file } })

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
      sx={{ p: 6, textAlign: 'center', borderStyle: 'dashed', borderWidth: 2 }}
      data-testid="open-local-panel"
    >
      <Typography variant="h5" component="h1" gutterBottom>
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
  const [threshold, setThreshold] = useState(120)
  const [targetColor, setTargetColor] = useState('#ff0000')
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
    if (source.kind !== 'server') return
    setError(null)
    setCsvUrl(null)
    setStatusMessage('')
    setIsProcessing(true)

    try {
      const result = await processVideo(source.filename, targetColor, threshold)
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
      // An empty filename disables the Process button (local videos can't be processed yet).
      filename={isLocal ? '' : title}
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
      <Typography variant="h4" component="h1" gutterBottom sx={{ wordBreak: 'break-word' }}>
        {title}
      </Typography>
      {sizeWarning && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {sizeWarning}
        </Alert>
      )}

      <AnalyzeViewer src={src} targetColor={targetColor} threshold={threshold} />

      <Box sx={{ mt: 3, display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' } }}>
        <Box>
          {isLocal ? (
            <>
              <Alert severity="info" sx={{ mb: 2, maxWidth: 640 }}>
                This video is on your computer. To run the full processing and get a CSV, the video
                has to be on the server first (uploading is coming soon). The live preview above works
                without it.
              </Alert>
              <Tooltip title="Local videos can't be processed on the server yet: upload the video first." placement="top">
                <Box data-testid="local-process-disabled">{controls}</Box>
              </Tooltip>
            </>
          ) : (
            controls
          )}

          {statusMessage && (
            <Alert severity="info" sx={{ mt: 2, maxWidth: 640, width: '100%' }}>
              {statusMessage}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2, maxWidth: 640, width: '100%' }}>
              {error}
            </Alert>
          )}
          {csvUrl && (
            <Alert severity="success" sx={{ mt: 2, maxWidth: 640, width: '100%' }}>
              Processing complete.{' '}
              <Link href={csvUrl} target="_blank" rel="noreferrer">
                Download CSV
              </Link>
            </Alert>
          )}
        </Box>

        <Stack spacing={2} data-testid="analysis-side-panel">
          {/* Workstream C: ColorToolsPanel, WarningsPanel, LiveStatsPanel go here */}
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
