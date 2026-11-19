// Port of DistanceImageBinarizer.java.

import { euclideanColorDistance } from './colorDistance'

/**
 * Minimal image shape: matches the browser's ImageData, and is easy to build
 * in tests. `data` is a flat RGBA array: [r, g, b, a, r, g, b, a, ...].
 */
export interface RgbaImage {
  readonly width: number
  readonly height: number
  readonly data: Uint8ClampedArray | Uint8Array
}

/**
 * Same as DistanceImageBinarizer.toBinaryArray.
 *
 * Returns a [y][x] array where a pixel is 1 (white) if its distance to
 * targetColor is strictly less than threshold, otherwise 0 (black).
 */
export function toBinaryArray(
  image: RgbaImage,
  targetColor: number,
  threshold: number,
): number[][] {
  const { width, height, data } = image
  const binaryArray: number[][] = []

  for (let y = 0; y < height; y++) {
    const row: number[] = new Array<number>(width)
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      // same as Java: image.getRGB(x, y) & 0xFFFFFF
      const pixelColor = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2]
      const distance = euclideanColorDistance(pixelColor, targetColor)

      if (distance < threshold) {
        row[x] = 1
      } else {
        row[x] = 0
      }
    }
    binaryArray.push(row)
  }
  return binaryArray
}

/**
 * Same as DistanceImageBinarizer.toBufferedImage, producing flat RGBA pixels
 * instead of a BufferedImage: 0 -> black, 1 -> white, always fully opaque.
 * Has no DOM dependency, so it can be used in Node tests.
 */
export function toRgbaPixels(binary: number[][]): Uint8ClampedArray {
  const height = binary.length
  const width = binary[0].length
  const pixels = new Uint8ClampedArray(width * height * 4)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const value = binary[y][x] === 0 ? 0 : 255
      pixels[i] = value
      pixels[i + 1] = value
      pixels[i + 2] = value
      pixels[i + 3] = 255
    }
  }
  return pixels
}

/** Browser-only wrapper around toRgbaPixels, ready for ctx.putImageData. */
export function toImageData(binary: number[][]): ImageData {
  const width = binary[0].length
  const height = binary.length
  const image = new ImageData(width, height)
  image.data.set(toRgbaPixels(binary))
  return image
}
