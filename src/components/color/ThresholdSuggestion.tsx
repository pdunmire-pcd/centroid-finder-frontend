import { Alert, Box, Button, Slider, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { summarizeSamples, suggestThreshold } from '../../centroid/engine'
import type { ColorSample } from '../../types'
import { formatHex } from './colorUtils'

export type ThresholdSuggestionProps = {
  samples: ColorSample[]
  /** the current target color, e.g. "#660005" */
  targetColor: string
  /** the threshold in use right now */
  threshold: number
  onApply: (threshold: number) => void
  /** starting value of the margin slider */
  defaultMargin?: number
}

/**
 * Suggests a threshold that is just big enough to include every sample.
 *
 * The suggestion is: furthest sample distance from the average + margin + 1.
 * The margin covers object colors we did not sample; the +1 is because the
 * binarizer only keeps pixels whose distance is strictly less than the threshold.
 */
export function ThresholdSuggestion({
  samples,
  targetColor,
  threshold,
  onApply,
  defaultMargin = 15,
}: ThresholdSuggestionProps) {
  const [margin, setMargin] = useState(defaultMargin)

  if (samples.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Take samples to get a suggested threshold.
      </Typography>
    )
  }

  const summary = summarizeSamples(samples.map((sample) => sample.rgb))
  const suggested = suggestThreshold(summary, margin)
  // The suggestion is measured from the average color, so it only fits if
  // that average is the color we are tracking.
  const usesAverage = formatHex(summary.mean).toLowerCase() === targetColor.toLowerCase()

  return (
    <Stack spacing={1.5}>
      <Box>
        <Typography id="margin-label" variant="body2" gutterBottom>
          Safety margin: {margin}
        </Typography>
        <Slider
          aria-labelledby="margin-label"
          value={margin}
          onChange={(_, value) => {
            if (typeof value === 'number') setMargin(value)
          }}
          min={0}
          max={100}
          valueLabelDisplay="auto"
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="body1">
          Suggested: <strong data-testid="suggested-threshold">{suggested}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Current: {threshold}
        </Typography>
        <Button variant="outlined" size="small" onClick={() => onApply(suggested)} disabled={suggested === threshold}>
          Apply
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" data-testid="threshold-explanation">
        Your furthest sample is {summary.maxDistance.toFixed(1)} away from the average color, plus a margin of {margin},
        plus 1 because a pixel must be strictly closer than the threshold, rounded up = {suggested}.
      </Typography>

      {!usesAverage && (
        <Alert severity="info">
          This suggestion assumes the average color ({formatHex(summary.mean)}) is the tracking color. Click
          “Use this color” first.
        </Alert>
      )}
    </Stack>
  )
}
