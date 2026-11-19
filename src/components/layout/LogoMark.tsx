import { Box } from '@mui/material'

// The app's logo: a crosshair with a filled dot at its centre (a centroid).
// Drawn with SVG so it is sharp at any size and follows the theme color.
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden="true"
      sx={{ color: 'primary.main', flexShrink: 0 }}
    >
      <rect x="1" y="1" width="30" height="30" rx="7" fill="currentColor" opacity="0.14" />
      <circle cx="16" cy="16" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M16 3v6M16 23v6M3 16h6M23 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="16" r="3" fill="currentColor" />
    </Box>
  )
}
