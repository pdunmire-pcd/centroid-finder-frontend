import { Box } from '@mui/material'

export type ColorSwatchProps = {
  /** any CSS color, e.g. "#660005" */
  color: string
  /** side length in pixels */
  size?: number
}

/** A small square filled with a color. Purely visual, so screen readers skip it. */
export function ColorSwatch({ color, size = 24 }: ColorSwatchProps) {
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 0.5,
        border: 1,
        borderColor: 'divider',
        bgcolor: color,
      }}
    />
  )
}
