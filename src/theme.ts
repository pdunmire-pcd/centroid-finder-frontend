import { alpha, createTheme } from '@mui/material'
import type { PaletteMode } from '@mui/material'

// One place for colors, shapes and fonts, so every page looks consistent.
// Other components should use these theme values (e.g. 'primary.main',
// 'text.secondary', theme.spacing) instead of hard-coding colors.
//
// The look is "calm lab notebook": warm ivory paper, hairline sand borders,
// espresso text, one muted sage accent for actions and focus, an elegant serif
// for headings and a clean sans for everything you read or click. Every
// text/background pair below is checked for WCAG AA contrast in
// tests/layout/contrast.test.ts, in both modes.

// ---- Fonts (self-hosted from @fontsource-variable, imported in main.tsx) ----

/** Headings: Fraunces, a soft, slightly rounded serif. */
export const headingFontFamily = '"Fraunces Variable", "Iowan Old Style", Georgia, serif'
/** Body text and controls: Inter, very readable at small sizes. */
export const bodyFontFamily = '"Inter Variable", "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
/** Monospace font for ids, hex colors and data tables */
export const monoFontFamily = '"JetBrains Mono Variable", "SFMono-Regular", Menlo, Consolas, monospace'

// ---- Colors ----

/** All the colors of one mode. Plain hex values, so a test can check contrast. */
export type DesignTokens = {
  /** page background */
  background: string
  /** cards, panels, the top bar */
  paper: string
  /** quiet areas inside a card (placeholders, code boxes) */
  subtle: string
  /** hairline borders between areas; decorative, so no contrast minimum */
  hairline: string
  /** borders that show where a control is (inputs, outlined buttons): 3:1 or more */
  controlBorder: string
  text: string
  textSecondary: string
  /** the one accent: primary buttons, links, selected things, focus ring */
  accent: string
  /** text/icons on top of the accent */
  onAccent: string
  /** pale accent wash for selected items */
  accentSoft: string
  /** a warm clay, only for data highlights (e.g. the histogram's threshold line) */
  clay: string
  error: string
  warning: string
  success: string
  info: string
  /** text on top of error/warning/success/info filled chips */
  onStatus: string
}

export const designTokens: Record<PaletteMode, DesignTokens> = {
  light: {
    background: '#FAF7F2', // ivory
    paper: '#FFFDF9', // soft white
    subtle: '#F3EEE6', // warm cream
    hairline: '#E7DFD3', // sand
    controlBorder: '#8F8172', // warm taupe
    text: '#2E2A26', // espresso ink
    textSecondary: '#6B6158', // taupe
    accent: '#52705A', // muted sage
    onAccent: '#FFFFFF',
    accentSoft: '#E4ECE3',
    clay: '#9C5A3C',
    error: '#A63D32',
    warning: '#8A5A00',
    success: '#3F6E4A',
    info: '#3D6278',
    onStatus: '#FFFFFF',
  },
  dark: {
    background: '#1E1915', // espresso
    paper: '#27211C', // mocha
    subtle: '#302923',
    hairline: '#3A322B',
    controlBorder: '#8A7B6C',
    text: '#F3ECE2', // cream
    textSecondary: '#BFB2A3', // latte
    accent: '#A9C2A9', // pale sage
    onAccent: '#1E1915',
    accentSoft: '#34402F',
    clay: '#E0A486',
    error: '#F0A399',
    warning: '#E8C27A',
    success: '#9CC9A2',
    info: '#9CC0D6',
    onStatus: '#1E1915',
  },
}

// Colors for charts: x line = blue, y line = orange, suspect-jump marks = magenta.
// These stay saturated on purpose: data must be easy to tell apart. Each mode
// has its own set, checked for color-blind separation and for 3:1 contrast
// against that mode's card color. Suspect marks are also dashed, so they never
// rely on color alone.
export const chartSeriesColors: Record<PaletteMode, { x: string; y: string; suspect: string }> = {
  light: { x: '#2a78d6', y: '#d0561f', suspect: '#c4407a' },
  dark: { x: '#3987e5', y: '#d95926', suspect: '#e87ba4' },
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

/** How strong the status-chip tint is: the status color at this opacity over the card. */
export const STATUS_TINT: Record<PaletteMode, number> = { light: 0.12, dark: 0.2 }

/** Corner radius in px. Cards use it as is; small things use a fraction. */
const RADIUS = 14

export type ThemeOptions = {
  /** the user asked the OS for more contrast (prefers-contrast: more) */
  highContrast?: boolean
}

export function createAppTheme(mode: PaletteMode, { highContrast = false }: ThemeOptions = {}) {
  const base = designTokens[mode]
  // With "more contrast", secondary text becomes full-strength text and the
  // hairlines become real borders. Everything else stays the same.
  const t: DesignTokens = highContrast
    ? { ...base, textSecondary: base.text, hairline: base.controlBorder }
    : base

  // Very soft, warm shadows; in dark mode a shadow is invisible, so the
  // hairline border alone separates cards.
  const softShadow =
    mode === 'light'
      ? '0 1px 2px rgba(74, 56, 38, 0.04), 0 12px 32px -18px rgba(74, 56, 38, 0.18)'
      : 'none'

  const focusRing = {
    outline: `2px solid ${t.accent}`,
    outlineOffset: 2,
  }

  return createTheme({
    palette: {
      mode,
      primary: { main: t.accent, contrastText: t.onAccent },
      secondary: { main: t.clay, contrastText: t.onAccent },
      error: { main: t.error, contrastText: t.onStatus },
      warning: { main: t.warning, contrastText: t.onStatus },
      success: { main: t.success, contrastText: t.onStatus },
      info: { main: t.info, contrastText: t.onStatus },
      background: { default: t.background, paper: t.paper },
      divider: t.hairline,
      text: { primary: t.text, secondary: t.textSecondary },
      action: {
        hover: alpha(t.text, 0.05),
        selected: alpha(t.accent, mode === 'light' ? 0.14 : 0.22),
      },
    },
    shape: { borderRadius: RADIUS },
    spacing: 8,
    typography: {
      fontFamily: bodyFontFamily,
      // Fluid sizes: clamp(smallest, grows with the screen, largest)
      h1: {
        fontFamily: headingFontFamily,
        fontSize: 'clamp(1.75rem, 1.35rem + 1.4vw, 2.5rem)',
        fontWeight: 500,
        lineHeight: 1.15,
        letterSpacing: '-0.01em',
      },
      h2: {
        fontFamily: headingFontFamily,
        fontSize: 'clamp(1.3rem, 1.15rem + 0.5vw, 1.6rem)',
        fontWeight: 500,
        lineHeight: 1.25,
      },
      h3: { fontFamily: headingFontFamily, fontSize: '1.15rem', fontWeight: 500, lineHeight: 1.3 },
      h4: { fontFamily: headingFontFamily, fontWeight: 500 },
      h5: { fontFamily: headingFontFamily, fontWeight: 500 },
      h6: { fontFamily: headingFontFamily, fontSize: '1.15rem', fontWeight: 500 },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      body1: { lineHeight: 1.6 },
      body2: { lineHeight: 1.55 },
      button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.005em' },
      overline: { fontWeight: 600, letterSpacing: '0.12em', fontSize: '0.7rem' },
      caption: { lineHeight: 1.5 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: { WebkitTextSizeAdjust: '100%', colorScheme: mode }, // native scrollbars and pickers follow the mode
          body: {
            // Tabular numbers: every digit is the same width, so columns line up
            fontVariantNumeric: 'tabular-nums',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            textRendering: 'optimizeLegibility',
          },
          '::selection': { backgroundColor: alpha(t.accent, 0.3) },
          // One clear focus ring for everything the keyboard can reach
          ':focus-visible': focusRing,
          // Calm motion only: people who ask for less motion get none
          '@media (prefers-reduced-motion: reduce)': {
            '*, *::before, *::after': {
              animationDuration: '0.01ms !important',
              animationIterationCount: '1 !important',
              transitionDuration: '0.01ms !important',
              scrollBehavior: 'auto !important',
            },
          },
          // On touch screens make every control at least 44 px tall (WCAG 2.5.8 asks
          // for 24 px; 44 px is the comfortable finger size).
          '@media (pointer: coarse)': {
            '.MuiButton-root, .MuiToggleButton-root, .MuiChip-clickable': { minHeight: 44 },
            '.MuiIconButton-root': { minWidth: 44, minHeight: 44 },
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 999, // soft pill buttons
            paddingInline: 18,
            minHeight: 36,
            transition: 'background-color 160ms ease, border-color 160ms ease, color 160ms ease',
          },
          sizeSmall: { minHeight: 30, paddingInline: 12 },
          sizeLarge: { minHeight: 46, paddingInline: 24 },
          outlined: { borderColor: t.controlBorder },
        },
      },
      MuiIconButton: {
        styleOverrides: { root: { '&.Mui-focusVisible': focusRing } },
      },
      MuiToggleButtonGroup: {
        // fit-content: the group is as wide as its buttons, even in a column layout
        styleOverrides: { root: { backgroundColor: t.paper, borderRadius: 999, width: 'fit-content', maxWidth: '100%' } },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            borderColor: t.controlBorder,
            color: t.textSecondary,
            textTransform: 'none',
            fontWeight: 600,
            paddingInline: 14,
            minHeight: 32,
            '&:first-of-type': { borderTopLeftRadius: 999, borderBottomLeftRadius: 999 },
            '&:last-of-type': { borderTopRightRadius: 999, borderBottomRightRadius: 999 },
            '&.Mui-selected, &.Mui-selected:hover': {
              color: t.text,
              backgroundColor: t.accentSoft,
            },
          },
        },
      },
      MuiPaper: {
        defaultProps: { variant: 'outlined' },
        styleOverrides: {
          outlined: { borderColor: t.hairline, boxShadow: softShadow },
          rounded: { borderRadius: RADIUS },
        },
      },
      MuiCard: { defaultProps: { variant: 'outlined' } },
      MuiCardActionArea: {
        styleOverrides: { focusHighlight: { backgroundColor: t.accent } },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: 'inherit' },
        styleOverrides: {
          root: {
            // a translucent paper bar that lets the page show through a little
            backgroundColor: alpha(t.background, 0.88),
            backdropFilter: 'saturate(140%) blur(10px)',
            boxShadow: 'none',
          },
        },
      },
      MuiTabs: {
        styleOverrides: { indicator: { height: 2, borderRadius: 2 } },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            color: t.textSecondary,
            '&.Mui-selected': { color: t.text },
            '&.Mui-focusVisible': { ...focusRing, outlineOffset: -4, borderRadius: 10 },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: t.paper,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: t.controlBorder },
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: { root: { borderRadius: RADIUS } },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: t.hairline },
          head: {
            fontWeight: 600,
            color: t.textSecondary,
            fontSize: '0.75rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap', // short headers on one line; the table scrolls instead
            backgroundColor: t.subtle,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600, borderRadius: 999 },
          outlined: { borderColor: t.controlBorder },
          // Status chips (Tracked, Error, ...) are a soft tint with colored text
          // instead of a heavy solid block. The text still has 4.5:1 contrast
          // on the tint (see STATUS_TINT in tests/layout/contrast.test.ts).
          filled: ({ ownerState }) => {
            const color = ownerState.color
            if (color === 'success' || color === 'error' || color === 'warning' || color === 'info') {
              return { backgroundColor: alpha(t[color], STATUS_TINT[mode]), color: t[color] }
            }
            return {}
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 12, alignItems: 'flex-start' },
          standard: { border: '1px solid', borderColor: alpha(t.text, 0.08) },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            borderRadius: RADIUS,
            borderColor: t.hairline,
            boxShadow: softShadow,
            '&::before': { display: 'none' }, // no extra line above the accordion
          },
        },
      },
      MuiSlider: {
        styleOverrides: {
          rail: { opacity: 1, backgroundColor: t.controlBorder },
          thumb: {
            boxShadow: 'none',
            '&.Mui-focusVisible, &:hover': { boxShadow: `0 0 0 6px ${alpha(t.accent, 0.2)}` },
            '&.Mui-focusVisible': focusRing,
          },
          markLabel: { color: t.textSecondary },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          // the off-track must be visible against the card (3:1)
          track: { backgroundColor: t.controlBorder, opacity: 1 },
          switchBase: { '&.Mui-focusVisible .MuiSwitch-thumb': { outline: `2px solid ${t.accent}`, outlineOffset: 2 } },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: mode === 'light' ? t.text : t.subtle,
            color: mode === 'light' ? t.background : t.text,
            fontSize: '0.78rem',
            borderRadius: 8,
          },
        },
      },
      MuiLink: {
        defaultProps: { underline: 'hover' },
        styleOverrides: { root: { fontWeight: 500 } },
      },
      MuiStepIcon: {
        styleOverrides: { text: { fontWeight: 600 } },
      },
    },
  })
}

// Kept for older imports: the light theme
export const theme = createAppTheme('light')
