import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Alert, Box, Button, Link, Paper, Stack, Typography } from '@mui/material'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { getProcessingStatus, getThumbnailUrl, processVideo } from '../api'
import { ProcessingControls } from '../components/ProcessingControls'
import { BinarizedPreview } from '../components/BinarizedPreview'
import { analyzeFrame, checkFrameQuality } from '../centroid/engine'
import { parseHexColor } from '../centroid/colorDistance'
import { ColorToolsPanel } from '../components/color/ColorToolsPanel'
import { DistanceHistogram } from '../components/color/DistanceHistogram'
import { DistanceMap } from '../components/color/DistanceMap'
import { LiveStatsPanel } from '../components/quality/LiveStatsPanel'
import { WarningsPanel } from '../components/quality/WarningsPanel'

// ---- Interim color tools (workstream C) ----
// The new Analyze page (workstream B) will pass live video frames instead.

/**
 * Loads an image URL into raw pixels (null while loading or on error).
 * colorSpaceConversion: 'none' keeps the file's exact RGB values, like Java.
 */
function useImageData(src: string): ImageData | null {
  const [loaded, setLoaded] = useState<{ src: string; image: ImageData } | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      const response = await fetch(src, { signal: controller.signal })
      if (!response.ok) throw new Error(`status ${response.status}`)
      const bitmap = await createImageBitmap(await response.blob(), { colorSpaceConversion: 'none' })
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) throw new Error('Canvas is not supported')
      ctx.drawImage(bitmap, 0, 0)
      bitmap.close()
      // use the canvas size: a closed bitmap reports width and height 0
      setLoaded({ src, image: ctx.getImageData(0, 0, canvas.width, canvas.height) })
    }
    // BinarizedPreview already shows the load error, so we just stay at null
    load().catch(() => {})
    return () => controller.abort()
  }, [src])

  // an image from an older src counts as "still loading"
  return loaded?.src === src ? loaded.image : null
}

/** A titled card. */
function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        {title}
      </Typography>
      {children}
    </Paper>
  )
}

// Route: /preview/:filename
// Starter version: shows the first frame. Nadia's binarized canvas and
// Paris's slider / color picker / process button plug in where marked below.
export default function PreviewPage() {
  // React Router already decodes the URL, so "my%20video.mp4" becomes "my video.mp4"
  const { filename = '' } = useParams()
  const [threshold, setThreshold] = useState(120)
  const [targetColor, setTargetColor] = useState('#ff0000')
  const [isProcessing, setIsProcessing] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [csvUrl, setCsvUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // The thumbnail is the first frame, so its time is 0 seconds.
  const frame = useImageData(getThumbnailUrl(filename))
  // Deferred values let the slider stay smooth while the analysis catches up.
  const deferredColor = useDeferredValue(targetColor)
  const deferredThreshold = useDeferredValue(threshold)
  const analysis = useMemo(() => {
    if (!frame) return null
    try {
      return analyzeFrame(frame, parseHexColor(deferredColor), deferredThreshold)
    } catch {
      return null // invalid color
    }
  }, [frame, deferredColor, deferredThreshold])
  const warnings = analysis ? checkFrameQuality(analysis) : null

  const startProcessing = async () => {
    setError(null)
    setCsvUrl(null)
    setStatusMessage('')
    setIsProcessing(true)

    try {
      const result = await processVideo(filename, targetColor, threshold)
      setJobId(result.jobId)
    } catch (caughtError) {
      setIsProcessing(false)
      setError(caughtError instanceof Error ? caughtError.message : 'Could not start processing')
    }
  }

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

  return (
    <>
      <Button component={RouterLink} to="/videos" sx={{ mb: 2 }}>
        ← Back to videos
      </Button>
      <Typography variant="h4" component="h1" gutterBottom>
        {filename}
      </Typography>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, alignItems: 'start' }}>
        {/* Left: the original frame, which you click to sample the animal */}
        <Panel title="Tracking color">
          <ColorToolsPanel
            frame={frame}
            currentTime={0}
            filename={filename}
            targetColor={targetColor}
            threshold={threshold}
            onTargetColorChange={setTargetColor}
            onThresholdChange={setThreshold}
          />
        </Panel>

        {/* Right: what the tracker will see with these settings */}
        <Stack spacing={3}>
          <Panel title="Binarized">
            <BinarizedPreview
              imageSrc={getThumbnailUrl(filename)}
              targetColor={targetColor}
              threshold={threshold}
            />
          </Panel>
          <Panel title="Frame check">
            <Stack spacing={2}>
              <LiveStatsPanel analysis={analysis} />
              <WarningsPanel warnings={warnings} />
            </Stack>
          </Panel>
          <Panel title="Color distances">
            <DistanceHistogram frame={frame} targetColor={targetColor} threshold={threshold} />
          </Panel>
          <Panel title="Distance map">
            <DistanceMap frame={frame} targetColor={targetColor} threshold={threshold} />
          </Panel>
        </Stack>
      </Box>

      <Box sx={{ mt: 3 }}>
        <ProcessingControls
          filename={filename}
          threshold={threshold}
          targetColor={targetColor}
          onThresholdChange={setThreshold}
          onTargetColorChange={setTargetColor}
          onProcess={startProcessing}
          isProcessing={isProcessing}
        />

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
    </>
  )
}
