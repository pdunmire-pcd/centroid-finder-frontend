import { describe, expect, it } from 'vitest'
import { downscaleNearest, normalizeScale, parseHexColor, type RgbaImage } from '../../src/centroid'
import { analyzeFrame } from '../../src/centroid/engine'
import { fixture, loadRgba, solidImage } from './helpers'

/** Black image with a white filled rectangle from (x0, y0) to (x1, y1) inclusive. */
function imageWithRectangle(
  width: number, height: number, x0: number, y0: number, x1: number, y1: number,
): RgbaImage {
  const image = solidImage(width, height, 0x000000)
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = (y * width + x) * 4
      image.data[i] = 255
      image.data[i + 1] = 255
      image.data[i + 2] = 255
    }
  }
  return image
}

describe('normalizeScale', () => {
  it('keeps values in (0, 1) and turns everything else into 1', () => {
    expect(normalizeScale(0.5)).toBe(0.5)
    expect(normalizeScale(1)).toBe(1)
    expect(normalizeScale(2)).toBe(1)
    expect(normalizeScale(0)).toBe(1)
    expect(normalizeScale(-0.5)).toBe(1)
    expect(normalizeScale(NaN)).toBe(1)
  })
})

describe('downscaleNearest', () => {
  it('makes an image of the rounded smaller size', () => {
    const small = downscaleNearest(solidImage(1920, 1080, 0x123456), 0.5)
    expect([small.width, small.height]).toEqual([960, 540])
    expect(Array.from(small.data.slice(0, 4))).toEqual([0x12, 0x34, 0x56, 255])
  })

  it('never makes an image smaller than 1x1', () => {
    const small = downscaleNearest(solidImage(3, 3, 0), 0.01)
    expect([small.width, small.height]).toEqual([1, 1])
  })
})

describe('analyzeFrame with scale', () => {
  it('scale 1 reports the full size and scale 1', () => {
    const result = analyzeFrame(solidImage(4, 3, 0), 0, 1)
    expect(result).toMatchObject({ width: 4, height: 3, sourceWidth: 4, sourceHeight: 3, scale: 1 })
    expect(result.bounds).toEqual([{ minX: 0, minY: 0, maxX: 3, maxY: 2 }])
  })

  it('an invalid scale falls back to full size', () => {
    expect(analyzeFrame(solidImage(4, 3, 0), 0, 1, 5).width).toBe(4)
  })

  it('scale 0.5 gives centroids and sizes in full-size coordinates', () => {
    // 200 x 100 rectangle centred near (700, 400) in a 1920x1080 frame
    const image = imageWithRectangle(1920, 1080, 600, 350, 799, 449)
    const exact = analyzeFrame(image, 0xffffff, 10)
    const half = analyzeFrame(image, 0xffffff, 10, 0.5)

    expect(half.width).toBe(960)
    expect(half.height).toBe(540)
    expect(half.sourceWidth).toBe(1920)
    expect(half.scale).toBe(0.5)
    expect(half.groups).toHaveLength(1)
    expect(Math.abs(half.groups[0].centroid.x - exact.groups[0].centroid.x)).toBeLessThanOrEqual(2)
    expect(Math.abs(half.groups[0].centroid.y - exact.groups[0].centroid.y)).toBeLessThanOrEqual(2)
    expect(half.groups[0].size).toBe(exact.groups[0].size)
    expect(half.bounds).toEqual([{ minX: 600, minY: 350, maxX: 799, maxY: 449 }])
  })

  it('a group on the edge of the small copy still touches the full-size edge', () => {
    const image = imageWithRectangle(101, 51, 90, 40, 100, 50)
    const result = analyzeFrame(image, 0xffffff, 10, 0.3)
    expect(result.bounds?.[0].maxX).toBe(100)
    expect(result.bounds?.[0].maxY).toBe(50)
  })

  it('on squares.jpg the big groups are close to the exact answer', async () => {
    const image = await loadRgba(fixture('squares.jpg'))
    const color = parseHexColor('FFA200')
    const exact = analyzeFrame(image, color, 164)
    const half = analyzeFrame(image, color, 164, 0.5)

    // the four big squares (the rest are a few stray pixels)
    for (let k = 0; k < 4; k++) {
      expect(Math.abs(half.groups[k].centroid.x - exact.groups[k].centroid.x)).toBeLessThanOrEqual(4)
      expect(Math.abs(half.groups[k].centroid.y - exact.groups[k].centroid.y)).toBeLessThanOrEqual(4)
      expect(Math.abs(half.groups[k].size - exact.groups[k].size) / exact.groups[k].size)
        .toBeLessThan(0.05)
    }
  })
})
