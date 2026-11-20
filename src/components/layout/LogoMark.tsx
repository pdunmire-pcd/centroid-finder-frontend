import { Box } from '@mui/material'

// The app's logo: a fine ring with a dot in its middle (the centroid) and a
// short trail of fading dots leading to it (the tracked path). Drawn with SVG,
// so it is sharp at any size; it uses the theme's accent color through
// currentColor. public/favicon.svg is the same drawing with fixed colors.
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden="true"
      sx={{ color: 'primary.main', flexShrink: 0 }}
    >
      {/* soft tinted tile */}
      <rect x="0.5" y="0.5" width="31" height="31" rx="10" fill="currentColor" opacity="0.13" />
      {/* the trail, oldest (faintest) first */}
      <circle cx="7.5" cy="24" r="1.3" fill="currentColor" opacity="0.35" />
      <circle cx="11" cy="21.5" r="1.5" fill="currentColor" opacity="0.6" />
      {/* the ring and the centroid */}
      <circle cx="18" cy="14" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="18" cy="14" r="2.6" fill="currentColor" />
    </Box>
  )
}
