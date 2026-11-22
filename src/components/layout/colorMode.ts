import { createContext, useContext } from 'react'
import type { PaletteMode } from '@mui/material'

// Shares the current light/dark mode and a toggle with any component.

export type ColorModeValue = {
  mode: PaletteMode
  toggleMode: () => void
}

export const ColorModeContext = createContext<ColorModeValue>({
  mode: 'light',
  toggleMode: () => {},
})

export function useColorMode(): ColorModeValue {
  return useContext(ColorModeContext)
}

const STORAGE_KEY = 'centroid-finder.color-mode'

// localStorage can throw (private windows, blocked storage), so we wrap it.
export function loadSavedMode(): PaletteMode | null {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved === 'light' || saved === 'dark' ? saved : null
  } catch {
    return null
  }
}

export function saveMode(mode: PaletteMode): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // Not saved; the app still works, it just forgets the choice.
  }
}

// First visit: follow the operating system setting
export function initialMode(): PaletteMode {
  const saved = loadSavedMode()
  if (saved) return saved
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}
