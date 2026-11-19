// Small pure helpers for the color tools. No React and no DOM here, so every
// function can be unit tested in Node (see tests/color/colorUtils.test.ts).

import type { RgbaImage } from '../../centroid/binarizer'
import { euclideanColorDistance } from '../../centroid/colorDistance'
import { rgbToHex } from '../../centroid/engine'
import type { RgbTriple } from '../../types'

/** The largest possible color distance: black to white, sqrt(3 * 255^2) ≈ 441.7. */
export const MAX_DISTANCE = 442

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

// ---- Request preview ----

/**
 * The exact request the Process button sends, built the same way as
 * processVideo() in src/api.ts, e.g.
 * "POST /process/salamander1.mp4?targetColor=660005&threshold=67".
 */
export function buildProcessRequest(filename: string, targetColor: string, threshold: number): string {
  const params = new URLSearchParams({
    targetColor: targetColor.replace('#', ''),
    threshold: String(threshold),
  })
  return `POST /process/${encodeURIComponent(filename)}?${params}`
}

// ---- Marker color ----

/** Bright colors that stand out on most videos. */
export const MARKER_CANDIDATES = ['#00e5ff', '#76ff03', '#ffea00', '#ff00ff', '#2979ff'] as const

/**
 * Picks the marker color (for the centroid dot or the track line) that is
 * furthest from the tracking color, so the marker never blends into the
 * animal it sits on. For a dark red salamander (#660005) this is cyan.
 */
export function contrastingMarkerColor(targetColor: string): string {
  const target = parseInt(targetColor.replace(/^#/, ''), 16)
  let best: string = MARKER_CANDIDATES[0]
  let bestDistance = -1
  for (const candidate of MARKER_CANDIDATES) {
    const distance = euclideanColorDistance(parseInt(candidate.slice(1), 16), target)
    if (distance > bestDistance) {
      best = candidate
      bestDistance = distance
    }
  }
  return best
}

// ---- Histogram ----

/**
 * Turns histogram counts into bar heights from 0 to 1 (1 = the tallest bar).
 *
 * With logScale, heights use log(1 + count), so a bin with 10 pixels is still
 * visible next to a bin with 1,000,000 pixels.
 */
export function histogramHeights(counts: number[], logScale: boolean): number[] {
  const scaled = counts.map((count) => (logScale ? Math.log10(1 + count) : count))
  const tallest = Math.max(0, ...scaled)
  if (tallest === 0) return scaled.map(() => 0)
  return scaled.map((value) => value / tallest)
}

/** Percentage (0-100) of all counted pixels that fall in bins below the threshold. */
export function percentBelowThreshold(counts: number[], threshold: number): number {
  const binWidth = MAX_DISTANCE / counts.length
  let total = 0
  let below = 0
  counts.forEach((count, i) => {
    total += count
    // a bin counts as "below" when its whole range is under the threshold
    if ((i + 1) * binWidth <= threshold) below += count
  })
  return total === 0 ? 0 : (below / total) * 100
}

// ---- Distance map ----

/**
 * A "heat" color for a value from 0 to 1: black -> red -> yellow -> white.
 * 1 means "very close to the target color".
 */
export function heatColor(value: number): RgbTriple {
  const v = Math.min(1, Math.max(0, value))
  const red = Math.round(255 * Math.min(1, v * 3))
  const green = Math.round(255 * Math.min(1, Math.max(0, v * 3 - 1)))
  const blue = Math.round(255 * Math.min(1, Math.max(0, v * 3 - 2)))
  return [red, green, blue]
}

/**
 * Builds RGBA pixels that show how close every pixel is to the target color.
 *
 * Distance 0 is white, distance = threshold is in the middle of the scale
 * (red-orange), and anything at twice the threshold or further is black. So
 * everything that would be tracked is in the bright half of the scale.
 */
export function distanceMapPixels(frame: RgbaImage, targetColor: number, threshold: number): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(frame.width * frame.height * 4)
  const range = Math.max(1, threshold * 2) // avoid dividing by 0 when threshold is 0

  // 442 possible whole distances -> precompute their colors once (faster)
  const palette: RgbTriple[] = []
  for (let d = 0; d <= MAX_DISTANCE; d++) palette.push(heatColor(1 - d / range))

  for (let i = 0; i < frame.data.length; i += 4) {
    const pixel = (frame.data[i] << 16) | (frame.data[i + 1] << 8) | frame.data[i + 2]
    const distance = euclideanColorDistance(pixel, targetColor)
    const [r, g, b] = palette[Math.round(distance)]
    pixels[i] = r
    pixels[i + 1] = g
    pixels[i + 2] = b
    pixels[i + 3] = 255
  }
  return pixels
}
