import { Box, Typography, type SxProps, type Theme } from '@mui/material'
import { monoFontFamily } from '../../theme'
import { ColorSwatch } from './ColorSwatch'
import { formatRgb, hexToRgb } from './colorUtils'

export type TrackingColorLegendProps = {
  /** e.g. "#660005" */
  targetColor: string
  threshold: number
  /** where to put the chip, e.g. { position: 'absolute', top: 8, left: 8 } */
  sx?: SxProps<Theme>
}

/**
 * A small dark chip showing the tracking settings, meant to sit on top of a
 * video or image so a screenshot always says which color was tracked.
 *
 * For the matching marker color use contrastingMarkerColor() from ./colorUtils.
 */
export function TrackingColorLegend({ targetColor, threshold, sx }: TrackingColorLegendProps) {
  let rgbText = 'invalid color'
  try {
    rgbText = formatRgb(hexToRgb(targetColor))
  } catch {
    // keep "invalid color"
  }

  return (
    <Box
      data-testid="tracking-legend"
      aria-label={`Tracking color ${targetColor}, threshold ${threshold}`}
      role="note"
      sx={[
        {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          px: 1,
          py: 0.5,
          borderRadius: 2,
          bgcolor: 'rgba(0, 0, 0, 0.7)', // dark and see-through: readable on any frame
          color: '#ffffff',
          pointerEvents: 'none', // clicks go through to the video underneath
        },
        // MUI lets sx be an array, so the parent's sx is added after ours
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <ColorSwatch color={targetColor} size={16} />
      <Typography variant="caption" sx={{ fontFamily: monoFontFamily, lineHeight: 1.2 }}>
        {targetColor} · {rgbText} · threshold {threshold}
      </Typography>
    </Box>
  )
}
