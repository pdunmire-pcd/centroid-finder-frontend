import { describe, expect, it } from 'vitest'
import { toBinaryArray, toRgbaPixels, type RgbaImage } from '../../src/centroid'

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

describe('toBinaryArray', () => {
  it('marks pixels close to the target as 1 and others as 0', () => {
    const image = imageFromRows([
      [0xff0000, 0x000000],
      [0x00ff00, 0xfe0101],
    ])
    expect(toBinaryArray(image, 0xff0000, 10)).toEqual([
      [1, 0],
      [0, 1],
    ])
  })

  it('returns a [y][x] array (height rows, width columns)', () => {
    const image = imageFromRows([
      [0, 0, 0],
      [0, 0, 0xffffff],
    ])
    const binary = toBinaryArray(image, 0xffffff, 1)
    expect(binary).toHaveLength(2)
    expect(binary[0]).toHaveLength(3)
    expect(binary[1][2]).toBe(1)
  })

  it('uses strict < : a distance equal to the threshold is black', () => {
    // distance from 0x000000 to 0x030400 is exactly 5
    const image = imageFromRows([[0x030400]])
    expect(toBinaryArray(image, 0x000000, 5)).toEqual([[0]])
    expect(toBinaryArray(image, 0x000000, 6)).toEqual([[1]])
  })

  it('threshold 0 makes everything black, even exact matches', () => {
    const image = imageFromRows([[0xff0000, 0xff0000]])
    expect(toBinaryArray(image, 0xff0000, 0)).toEqual([[0, 0]])
  })

  it('ignores the alpha channel', () => {
    const image = imageFromRows([[0xff0000]])
    ;(image.data as Uint8ClampedArray)[3] = 0 // fully transparent
    expect(toBinaryArray(image, 0xff0000, 1)).toEqual([[1]])
  })
})

describe('toRgbaPixels', () => {
  it('turns 0 into opaque black and 1 into opaque white', () => {
    expect(Array.from(toRgbaPixels([[0, 1]]))).toEqual([
      0, 0, 0, 255,
      255, 255, 255, 255,
    ])
  })

  it('lays pixels out row by row', () => {
    const pixels = toRgbaPixels([
      [0, 0],
      [0, 1],
    ])
    // pixel (x:1, y:1) is the 4th pixel -> index 12
    expect(pixels[12]).toBe(255)
    expect(pixels[0]).toBe(0)
  })
})
