// Fast version of binarizer.ts for live video.
//
// It marks exactly the same pixels as toBinaryArray (distance < threshold),
// but writes into a flat Uint8Array that can be reused frame after frame, and
// skips the square root.

import type { RgbaImage } from './binarizer'

/**
 * The biggest possible squared color distance: 255² + 255² + 255².
 */
const MAX_SQUARED_DISTANCE = 3 * 255 * 255

/**
 * Turns a threshold into a whole-number limit on the SQUARED distance, so that
 *
 *   squaredDistance < limit   gives exactly the same answer as
 *   Math.sqrt(squaredDistance) < threshold
 *
 * for every possible pixel. Squared distances are always whole numbers, so we
 * start from threshold² and nudge the limit until it sits exactly on the
 * boundary, checking with Math.sqrt itself. This keeps the strict "<" of the
 * Java code even for thresholds like 164.5 where threshold² is not exact.
 */
export function squaredThresholdLimit(threshold: number): number {
  // Negative or NaN thresholds never match anything (sqrt(...) < NaN is false).
  if (!(threshold > 0)) return 0

  // No pixel can be further away than MAX_SQUARED_DISTANCE, so cap the limit
  // there (this also handles Infinity).
  let limit = Math.min(Math.ceil(threshold * threshold), MAX_SQUARED_DISTANCE + 1)

  // Move down while the value just below the limit is NOT inside the threshold.
  while (limit > 0 && Math.sqrt(limit - 1) >= threshold) limit--
  // Move up while the limit itself IS still inside the threshold.
  while (limit <= MAX_SQUARED_DISTANCE && Math.sqrt(limit) < threshold) limit++

  return limit
}

/** Result of binarizeInto. */
export interface BinarizeResult {
  /** width * height entries, 1 = within the threshold, 0 = not */
  readonly binary: Uint8Array
  /** how many entries are 1 */
  readonly matchingPixels: number
}

/**
 * Binarizes an RGBA image into a flat array: binary[y * width + x] is 1 when
 * the pixel's distance to targetColor is strictly less than threshold.
 *
 * Pass `output` to reuse the same array every frame (no new memory). It must
 * have exactly width * height entries; otherwise a new array is made.
 */
export function binarizeInto(
  image: RgbaImage,
  targetColor: number,
  threshold: number,
  output?: Uint8Array,
): BinarizeResult {
  const { width, height, data } = image
  const pixelCount = width * height
  const binary =
    output && output.length === pixelCount ? output : new Uint8Array(pixelCount)

  // Split the target color into its parts once, not once per pixel.
  const targetRed = (targetColor >> 16) & 0xff
  const targetGreen = (targetColor >> 8) & 0xff
  const targetBlue = targetColor & 0xff
  const limit = squaredThresholdLimit(threshold)

  let matchingPixels = 0
  // p = pixel number, i = where its red byte is in `data` (4 bytes per pixel)
  for (let p = 0, i = 0; p < pixelCount; p++, i += 4) {
    const redDiff = data[i] - targetRed
    const greenDiff = data[i + 1] - targetGreen
    const blueDiff = data[i + 2] - targetBlue
    const squared = redDiff * redDiff + greenDiff * greenDiff + blueDiff * blueDiff

    if (squared < limit) {
      binary[p] = 1
      matchingPixels++
    } else {
      binary[p] = 0
    }
  }
  return { binary, matchingPixels }
}

/** Flat-array version of toRgbaPixels: 0 -> black, 1 -> white, opaque. */
export function binaryToRgba(binary: Uint8Array, output?: Uint8ClampedArray): Uint8ClampedArray {
  const size = binary.length * 4
  const pixels = output && output.length === size ? output : new Uint8ClampedArray(size)
  for (let p = 0, i = 0; p < binary.length; p++, i += 4) {
    const value = binary[p] === 0 ? 0 : 255
    pixels[i] = value
    pixels[i + 1] = value
    pixels[i + 2] = value
    pixels[i + 3] = 255
  }
  return pixels
}
