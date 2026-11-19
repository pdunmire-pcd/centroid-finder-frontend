import { Box, Button, Stack, Typography } from '@mui/material'
import { summarizeSamples } from '../../centroid/engine'
import type { ColorSample } from '../../types'
import { ColorSwatch } from './ColorSwatch'
import { describeSpread, formatHex, formatRgb } from './colorUtils'

export type TargetColorFromSamplesProps = {
  samples: ColorSample[]
  /** the current target color, e.g. "#660005" */
  targetColor: string
  /** called with the samples' average color, e.g. "#640106" */
  onUseColor: (hex: string) => void
}

/**
 * Shows the average color of all samples and how spread out they are, with a
 * button to make that average the tracking color.
 */
export function TargetColorFromSamples({ samples, targetColor, onUseColor }: TargetColorFromSamplesProps) {
  if (samples.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Take at least one sample to get a suggested tracking color.
      </Typography>
    )
  }

  // mean = average R, G and B; maxDistance = how far the furthest sample is from it
  const summary = summarizeSamples(samples.map((sample) => sample.rgb))
  const meanHex = formatHex(summary.mean)
  const alreadyUsed = meanHex.toLowerCase() === targetColor.toLowerCase()

  return (
    <Stack spacing={1} data-testid="target-from-samples">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <ColorSwatch color={meanHex} size={36} />
        <Box>
          <Typography variant="body1" sx={{ fontFamily: 'monospace' }} data-testid="mean-color">
            {meanHex}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            {formatRgb(summary.mean)}
          </Typography>
        </Box>
      </Box>

      <Typography variant="body2">
        Average of {samples.length} sample{samples.length === 1 ? '' : 's'}. Spread:{' '}
        {summary.maxDistance.toFixed(1)} (the furthest sample's distance from the average).
      </Typography>
      <Typography variant="body2" color="text.secondary" data-testid="spread-words">
        {describeSpread(summary.maxDistance)}
      </Typography>

      <Box>
        <Button variant="outlined" onClick={() => onUseColor(meanHex)} disabled={alreadyUsed}>
          {alreadyUsed ? 'This is the tracking color' : 'Use this color'}
        </Button>
      </Box>
    </Stack>
  )
}
