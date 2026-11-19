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

// Largest possible color distance (black to white is about 441.7).
const MAX_THRESHOLD = 442

// Labels under the two ends of the slider.
const THRESHOLD_MARKS = [
  { value: 0, label: 'Exact match' },
  { value: MAX_THRESHOLD, label: 'Any color' },
]

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
    if (typeof threshold !== 'number' || threshold < 0 || threshold > MAX_THRESHOLD) {
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
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
              <Slider
                aria-labelledby="threshold-label"
                value={threshold}
                onChange={(_, value) => {
                  if (typeof value === 'number') onThresholdChange(value)
                }}
                min={0}
                max={MAX_THRESHOLD}
                marks={THRESHOLD_MARKS}
                valueLabelDisplay="auto"
                sx={{ mx: 4 }} // room for the end labels
              />
              <TextField
                label="Threshold"
                type="number"
                size="small"
                value={threshold}
                onChange={(event) => {
                  // ignore an empty box while the user is still typing
                  if (event.target.value === '') return
                  const typed = Math.round(Number(event.target.value))
                  if (Number.isNaN(typed)) return
                  onThresholdChange(Math.min(MAX_THRESHOLD, Math.max(0, typed)))
                }}
                slotProps={{ htmlInput: { min: 0, max: MAX_THRESHOLD, step: 1, 'data-testid': 'threshold-input' } }}
                sx={{ width: 110, flexShrink: 0 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              A pixel is tracked when its color distance to the target is less than the threshold.
            </Typography>
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