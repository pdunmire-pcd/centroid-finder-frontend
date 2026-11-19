import { createTheme } from '@mui/material'
import type { PaletteMode } from '@mui/material'

// One place for colors, shapes and fonts, so every page looks consistent.
// Other components should use these theme values (e.g. 'primary.main',
// 'text.secondary', theme.spacing) instead of hard-coding colors.

// Monospace font for ids, hex colors and data tables
export const monoFontFamily = '"JetBrains Mono", "SFMono-Regular", Menlo, Consolas, monospace'

// Line colors for charts (x = blue, y = orange). Each mode has its own pair,
// checked for color-blind separation and contrast against that mode's background.
export const chartSeriesColors: Record<PaletteMode, { x: string; y: string }> = {
  light: { x: '#2a78d6', y: '#eb6834' },
  dark: { x: '#3987e5', y: '#d95926' },
}

// Hides text on screen but keeps it for screen readers (e.g. an "Actions" column header)
export const visuallyHiddenSx = {
  position: 'absolute',
  width: '1px', // a plain 1 would mean 100% in sx
  height: '1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
} as const

// Colors for the two modes. Picked so text has good contrast on both.
const lightPalette = {
  primary: { main: '#1d5f8a' }, // steel blue
  secondary: { main: '#b4530a' }, // burnt orange, used for highlights
  background: { default: '#f3f5f7', paper: '#ffffff' },
  divider: '#dde3e8',
  text: { primary: '#17202a', secondary: '#55616d' },
}

const darkPalette = {
  primary: { main: '#7ab8e0' },
  secondary: { main: '#f0a35e' },
  background: { default: '#0f1418', paper: '#171e24' },
  divider: '#2a343d',
  text: { primary: '#e6ebef', secondary: '#9aa7b2' },
}

export function createAppTheme(mode: PaletteMode) {
  return createTheme({
    palette: { mode, ...(mode === 'light' ? lightPalette : darkPalette) },
    shape: { borderRadius: 8 },
    spacing: 8,
    typography: {
      fontFamily: '"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      h1: { fontSize: '1.75rem', fontWeight: 600 },
      h2: { fontSize: '1.25rem', fontWeight: 600 },
      h3: { fontSize: '1.05rem', fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
      overline: { fontWeight: 600, letterSpacing: '0.08em' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          // Tabular numbers: every digit is the same width, so columns line up
          body: { fontVariantNumeric: 'tabular-nums' },
        },
      },
      MuiButton: { defaultProps: { disableElevation: true } },
      MuiPaper: { defaultProps: { variant: 'outlined' } },
      MuiCard: { defaultProps: { variant: 'outlined' } },
      MuiAppBar: { defaultProps: { elevation: 0, color: 'inherit' } },
      MuiTableCell: { styleOverrides: { head: { fontWeight: 600 } } },
      MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    },
  })
}

// Kept for older imports: the light theme
export const theme = createAppTheme('light')
