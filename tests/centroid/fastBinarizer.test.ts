import { describe, expect, it } from 'vitest'
import {
  binarizeInto,
  binaryToRgba,
  squaredThresholdLimit,
  toBinaryArray,
  type RgbaImage,
} from '../../src/centroid'

/** Builds an RgbaImage from rows of 0xRRGGBB colors. */
function imageFromRows(rows: number[][]): RgbaImage {
  const height = rows.length
  const width = rows[0].length
  const data = new Uint8ClampedArray(width * height * 4)
  rows.forEach((row, y) =>
    row.forEach((color, x) => {
      const i = (y * width + x) * 4
      data[i] = (color >> 16) & 0xff
      data[i + 1] = (color >> 8) & 0xff
      data[i + 2] = color & 0xff
      data[i + 3] = 255
    }),
  )
  return { width, height, data }
}

describe('squaredThresholdLimit', () => {
  it('agrees with Math.sqrt(s) < threshold for every possible squared distance', () => {
    const thresholds = [0, 0.5, 1, 1.0000001, 2, 10, 99.99, 164, 164.5, 200.25, 441.67, 442, 1000]
    for (const threshold of thresholds) {
      const limit = squaredThresholdLimit(threshold)
      for (let s = 0; s <= 3 * 255 * 255; s++) {
        if ((s < limit) !== (Math.sqrt(s) < threshold)) {
          throw new Error(`mismatch at threshold ${threshold}, squared distance ${s}`)
        }
      }
    }
  })

  it('never matches for zero, negative or NaN thresholds', () => {
    expect(squaredThresholdLimit(0)).toBe(0)
    expect(squaredThresholdLimit(-5)).toBe(0)
    expect(squaredThresholdLimit(NaN)).toBe(0)
  })

  it('matches everything for an infinite threshold', () => {
    expect(squaredThresholdLimit(Infinity)).toBe(3 * 255 * 255 + 1)
  })
})

describe('binarizeInto', () => {
  it('marks pixels strictly closer than the threshold', () => {
    // 0x0a0000 is exactly 10 away from black, so threshold 10 leaves it out
    const image = imageFromRows([[0x000000, 0x0a0000, 0x090000]])
    expect(Array.from(binarizeInto(image, 0x000000, 10).binary)).toEqual([1, 0, 1])
  })

  it('counts matching pixels', () => {
    const image = imageFromRows([[0xff0000, 0x000000], [0x00ff00, 0xfe0101]])
    expect(binarizeInto(image, 0xff0000, 10).matchingPixels).toBe(2)
  })

  it('agrees with toBinaryArray', () => {
    const image = imageFromRows([
      [0xff0000, 0x000000, 0x123456],
      [0x00ff00, 0xfe0101, 0xffffff],
    ])
    const expected = toBinaryArray(image, 0x102030, 100).flat()
    expect(Array.from(binarizeInto(image, 0x102030, 100).binary)).toEqual(expected)
  })

  it('reuses an output array of the right size', () => {
    const image = imageFromRows([[0x000000, 0xffffff]])
    const output = new Uint8Array(2)
    expect(binarizeInto(image, 0, 1, output).binary).toBe(output)
    // the wrong size is replaced instead of being written past its end
    expect(binarizeInto(image, 0, 1, new Uint8Array(5)).binary).toHaveLength(2)
  })
})

describe('binaryToRgba', () => {
  it('turns 0 into black and 1 into white, fully opaque', () => {
    expect(Array.from(binaryToRgba(Uint8Array.from([0, 1])))).toEqual([
      0, 0, 0, 255, 255, 255, 255, 255,
    ])
  })
})
