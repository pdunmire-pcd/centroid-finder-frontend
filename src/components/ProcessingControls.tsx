import {
  Box,
  Button,
  Card,
  CardContent,
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect } from 'react'

export type ProcessingControlsProps = {
  filename: string
  threshold: number
  targetColor: string
  onThresholdChange: (threshold: number) => void
  onTargetColorChange: (color: string) => void
  onProcess: () => void
  isProcessing: boolean
}

export function ProcessingControls({
  filename,
  threshold,
  targetColor,
  onThresholdChange,
  onTargetColorChange,
  onProcess,
  isProcessing,
}: ProcessingControlsProps) {
  useEffect(() => {
    if (typeof threshold !== 'number' || threshold < 0 || threshold > 255) {
      onThresholdChange(128)
    }
  }, [threshold, onThresholdChange])

  return (
    <Card sx={{ maxWidth: 640, width: '100%' }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Processing Settings
        </Typography>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          Video: {filename || 'No video selected'}
        </Typography>

        <Stack spacing={3} sx={{ mt: 2 }}>
          <Box>
            <Typography id="threshold-label" gutterBottom>
              Threshold: {threshold}
            </Typography>
            <Slider
              aria-labelledby="threshold-label"
              value={threshold}
              onChange={(_, value) => {
                if (typeof value === 'number') onThresholdChange(value)
              }}
              min={0}
              max={255}
              valueLabelDisplay="auto"
            />
          </Box>

          <TextField
            label="Target color"
            type="color"
            value={targetColor}
            onChange={(event) => onTargetColorChange(event.target.value)}
            slotProps={{ htmlInput: { 'aria-label': 'Target color' } }}
          />

          <Button
            variant="contained"
            size="large"
            onClick={onProcess}
            disabled={!filename || isProcessing}
          >
            {isProcessing ? 'Processing…' : 'Process Video with These Settings'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}