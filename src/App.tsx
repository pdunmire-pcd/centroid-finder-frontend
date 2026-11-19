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
      </Box>
    </>
  )
}

export default App
