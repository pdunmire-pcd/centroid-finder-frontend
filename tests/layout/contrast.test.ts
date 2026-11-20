import { describe, expect, it } from 'vitest'
import type { PaletteMode } from '@mui/material'
import { blend, contrastRatio } from '../../src/a11y/contrast'
import { chartSeriesColors, designTokens, STATUS_TINT } from '../../src/theme'

// Checks every text and control color pair of the theme against WCAG 2.2 AA,
// in both modes. If you change a color in src/theme.ts and this fails, the
// new color is too faint (or too close to its background) to read.

const TEXT = 4.5 // normal text
const NON_TEXT = 3 // large text, control borders, focus ring, chart lines

type Pair = { name: string; fg: string; bg: string; min: number }

/** Every pair that matters for one mode. */
function contrastPairs(mode: PaletteMode): Pair[] {
  const t = designTokens[mode]
  const chart = chartSeriesColors[mode]
  const pairs: Pair[] = []

  // Text on each surface
  for (const [surface, bg] of [
    ['background', t.background],
    ['paper', t.paper],
    ['subtle', t.subtle],
  ] as const) {
    pairs.push({ name: `text on ${surface}`, fg: t.text, bg, min: TEXT })
    pairs.push({ name: `secondary text on ${surface}`, fg: t.textSecondary, bg, min: TEXT })
    pairs.push({ name: `accent (links) on ${surface}`, fg: t.accent, bg, min: TEXT })
  }

  // Buttons and selected things
  pairs.push({ name: 'text on accent (primary button)', fg: t.onAccent, bg: t.accent, min: TEXT })
  pairs.push({ name: 'text on accent wash (selected toggle)', fg: t.text, bg: t.accentSoft, min: TEXT })
  pairs.push({ name: 'clay (histogram label) on paper', fg: t.clay, bg: t.paper, min: TEXT })

  // Status colors: as text on a card, and on their own soft chip tint
  for (const status of ['error', 'warning', 'success', 'info'] as const) {
    pairs.push({ name: `${status} text on paper`, fg: t[status], bg: t.paper, min: TEXT })
    const tint = blend(t[status], t.paper, STATUS_TINT[mode])
    pairs.push({ name: `${status} chip text on its tint`, fg: t[status], bg: tint, min: TEXT })
  }

  // Non-text: what shows where a control is and where focus is
  pairs.push({ name: 'control border on paper', fg: t.controlBorder, bg: t.paper, min: NON_TEXT })
  pairs.push({ name: 'control border on background', fg: t.controlBorder, bg: t.background, min: NON_TEXT })
  pairs.push({ name: 'focus ring (accent) on background', fg: t.accent, bg: t.background, min: NON_TEXT })
  pairs.push({ name: 'focus ring (accent) on paper', fg: t.accent, bg: t.paper, min: NON_TEXT })

  // Chart lines on the card they sit on
  pairs.push({ name: 'chart x line on paper', fg: chart.x, bg: t.paper, min: NON_TEXT })
  pairs.push({ name: 'chart y line on paper', fg: chart.y, bg: t.paper, min: NON_TEXT })
  pairs.push({ name: 'chart suspect mark on paper', fg: chart.suspect, bg: t.paper, min: NON_TEXT })

  return pairs
}

describe.each(['light', 'dark'] as const)('%s theme contrast (WCAG 2.2 AA)', (mode) => {
  it.each(contrastPairs(mode))('$name', ({ fg, bg, min }) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(min)
  })
})

describe('contrastRatio', () => {
  it('matches the WCAG reference values', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrastRatio('#ffffff', '#ffffff')).toBe(1)
    // the classic "just passes AA" grey on white
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 2)
  })

  it('blends a tint the way the browser paints it', () => {
    expect(blend('#000000', '#ffffff', 0.5)).toBe('#808080')
  })
})
