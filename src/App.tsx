import { useState } from 'react'
import { Box, CssBaseline } from '@mui/material'
import { ProcessingControls } from './components/ProcessingControls'
import './App.css'

function App() {
  const [threshold, setThreshold] = useState(120)
  const [targetColor, setTargetColor] = useState('#ff0000')
  const [isProcessing, setIsProcessing] = useState(false)

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
          onProcess={() => setIsProcessing(true)}
          isProcessing={isProcessing}
        />
      </Box>
    </>
  )
}

export default App
