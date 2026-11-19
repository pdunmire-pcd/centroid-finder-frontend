// Small pure helpers for the color tools. No React and no DOM here, so every
// function can be unit tested in Node (see tests/color/colorUtils.test.ts).

import { rgbToHex } from '../../centroid/engine'
import type { RgbTriple } from '../../types'

/** The sample square sizes the user can pick (side length in pixels). */
export const SAMPLE_SIZES = [1, 3, 5, 9] as const

/** [r, g, b] -> "#rrggbb" (lowercase, with the '#'). */
export function formatHex(rgb: RgbTriple): string {
  return `#${rgbToHex(rgb)}`
}

/** "#660005" or "660005" -> [102, 0, 5]. Throws on anything else. */
export function hexToRgb(hex: string): RgbTriple {
  const clean = hex.replace(/^#/, '')
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    throw new RangeError(`invalid hex color: ${hex}`)
  }
  const value = parseInt(clean, 16)
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff]
}

/** [102, 0, 5] -> "rgb(102, 0, 5)", for display. */
export function formatRgb([r, g, b]: RgbTriple): string {
  return `rgb(${r}, ${g}, ${b})`
}

/** 1.234 -> "1.23 s" */
export function formatSeconds(seconds: number): string {
  return `${seconds.toFixed(2)} s`
}

/**
 * Puts the spread of the samples (the furthest sample's color distance from
 * their average, 0-442) into plain words.
 */
export function describeSpread(maxDistance: number): string {
  if (maxDistance < 10) return 'Very consistent: the samples are almost the same color.'
  if (maxDistance < 25) return 'Consistent: the samples are close to each other.'
  if (maxDistance < 50) return 'Somewhat varied: normal for an animal with light and shadow.'
  return 'Very varied: some samples may be background. Check the list and remove odd ones.'
}

/**
 * Converts a click position on a (possibly resized) canvas into a pixel of
 * the frame. The canvas is drawn at the frame's real size but CSS may show it
 * bigger or smaller, so we scale by frame size / shown size.
 */
export function clientToPixel(
  offsetX: number,
  offsetY: number,
  shownWidth: number,
  shownHeight: number,
  frameWidth: number,
  frameHeight: number,
): { x: number; y: number } {
  const x = Math.floor((offsetX * frameWidth) / shownWidth)
  const y = Math.floor((offsetY * frameHeight) / shownHeight)
  // keep the pixel inside the frame, even for clicks on the very edge
  return {
    x: Math.min(frameWidth - 1, Math.max(0, x)),
    y: Math.min(frameHeight - 1, Math.max(0, y)),
  }
}
