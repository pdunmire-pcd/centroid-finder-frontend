import { useState, useEffect } from 'react'
import { Box, CssBaseline, Alert, Link } from '@mui/material'
import { ProcessingControls } from './components/ProcessingControls'
import { getProcessingStatus, processVideo } from './api'
import './App.css'

function App() {
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
      const result = await processVideo(
        'intro.mp4',
        targetColor,
        threshold,
      )

      setJobId(result.jobId)
    } catch (caughtError) {
      setIsProcessing(false)
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not start processing',
      )
    }
  }

  useEffect(() => {
    if (!jobId || !isProcessing) return

    const interval = window.setInterval(async () => {
      try {
        const status = await getProcessingStatus(jobId)

        if (status.status === 'processing') {
          setStatusMessage('Processing video…')
        }

        if (status.status === 'done') {
          setCsvUrl(status.result)
          setStatusMessage('')
          setIsProcessing(false)
        }

        if (status.status === 'error') {
          setError(status.error)
          setStatusMessage('')
          setIsProcessing(false)
        }
      } catch (caughtError) {
        setIsProcessing(false)
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'Could not check processing status',
        )
      }
    }, 2000)

    return () => window.clearInterval(interval)
  }, [jobId, isProcessing])

  return (
    <>
      <CssBaseline />
      <Box
        component="main"
        sx={{
          minHeight: '100vh',
          p: 4,
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
        }}
      >
        <ProcessingControls
          filename="intro.mp4"
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

export default App
