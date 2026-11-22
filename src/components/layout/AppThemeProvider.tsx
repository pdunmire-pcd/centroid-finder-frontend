import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { CssBaseline, ThemeProvider, useMediaQuery } from '@mui/material'
import type { PaletteMode } from '@mui/material'
import { createAppTheme } from '../../theme'
import { ColorModeContext, initialMode, saveMode } from './colorMode'

// Wraps the app in the MUI theme and remembers light/dark mode.
export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>(initialMode)

  // The operating system's "increase contrast" setting (macOS, iOS, Windows)
  const highContrast = useMediaQuery('(prefers-contrast: more)')

  // Only rebuild the theme when the mode or the contrast setting changes
  const theme = useMemo(() => createAppTheme(mode, { highContrast }), [mode, highContrast])

  const colorMode = useMemo(
    () => ({
      mode,
      toggleMode: () => {
        const next = mode === 'light' ? 'dark' : 'light'
        setMode(next)
        saveMode(next)
      },
    }),
    [mode],
  )

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        {/* CssBaseline resets browser default styles so MUI looks the same everywhere */}
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}
