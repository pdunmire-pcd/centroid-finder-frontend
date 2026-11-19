import { useEffect, useState } from 'react'
import { Alert, Box, Button, Link, Paper, Typography } from '@mui/material'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { getProcessingStatus, getThumbnailUrl, getVideoUrl, processVideo } from '../api'
import { ProcessingControls } from '../components/ProcessingControls'
import { BinarizedPreview } from '../components/BinarizedPreview'

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

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Original
          </Typography>
          <Box
            component="video"
            src={getVideoUrl(filename)}
            poster={getThumbnailUrl(filename)}
            aria-label={`Video ${filename}`}
            data-cy="original-video"
            controls
            muted
            playsInline
            preload="metadata"
            sx={{ width: '100%', display: 'block', bgcolor: 'grey.200' }}
          />
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Binarized
          </Typography>
          <BinarizedPreview
            imageSrc={getThumbnailUrl(filename)}
            targetColor={targetColor}
            threshold={threshold}
          />
        </Paper>
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
