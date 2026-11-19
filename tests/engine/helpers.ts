// Shared helpers for the engine tests and benchmark.

import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import type { RgbaImage } from '../../src/centroid'

export const fixture = (name: string) =>
  fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url))

/** Decodes an image file into RGBA pixels with sharp (same as matchesJava.test.ts). */
export async function loadRgba(path: string): Promise<RgbaImage> {
  const { data, info } = await sharp(path)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  return { width: info.width, height: info.height, data }
}

/**
 * Small seeded random number generator (mulberry32). The same seed always
 * gives the same numbers, so a failing random test can be repeated exactly.
 * Returns numbers in [0, 1).
 */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Random image whose pixels are picked from a small palette, so that nearby
 * pixels often share a color and form groups (pure noise gives tiny groups).
 */
export function randomImage(
  random: () => number,
  width: number,
  height: number,
  palette: number[],
): RgbaImage {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let p = 0; p < width * height; p++) {
    const color = palette[Math.floor(random() * palette.length)]
    data[p * 4] = (color >> 16) & 0xff
    data[p * 4 + 1] = (color >> 8) & 0xff
    data[p * 4 + 2] = color & 0xff
    data[p * 4 + 3] = 255
  }
  return { width, height, data }
}

/** An image where every pixel is the same color. */
export function solidImage(width: number, height: number, color: number): RgbaImage {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let p = 0; p < width * height; p++) {
    data[p * 4] = (color >> 16) & 0xff
    data[p * 4 + 1] = (color >> 8) & 0xff
    data[p * 4 + 2] = color & 0xff
    data[p * 4 + 3] = 255
  }
  return { width, height, data }
}
