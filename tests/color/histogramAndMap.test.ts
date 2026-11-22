import { describe, expect, it } from 'vitest'
import {
  distanceMapPixels,
  heatColor,
  histogramHeights,
  percentBelowThreshold,
} from '../../src/components/color/colorUtils'

describe('histogramHeights', () => {
  it('scales the tallest bar to 1', () => {
    expect(histogramHeights([0, 5, 10], false)).toEqual([0, 0.5, 1])
  })

  it('log scale makes small bars visible', () => {
    const [small, big] = histogramHeights([9, 999_999], true)
    // log10(10) / log10(1,000,000) = 1 / 6
    expect(small).toBeCloseTo(1 / 6)
    expect(big).toBe(1)
  })

  it('handles an empty histogram', () => {
    expect(histogramHeights([0, 0], true)).toEqual([0, 0])
  })
})

describe('percentBelowThreshold', () => {
  it('counts the bins fully under the threshold', () => {
    // 2 bins: 0-221 and 221-442
    expect(percentBelowThreshold([30, 70], 221)).toBe(30)
    expect(percentBelowThreshold([30, 70], 100)).toBe(0)
    expect(percentBelowThreshold([30, 70], 442)).toBe(100)
  })
})

describe('heatColor', () => {
  it('goes black -> red -> yellow -> white', () => {
    expect(heatColor(0)).toEqual([0, 0, 0])
    expect(heatColor(1 / 3)).toEqual([255, 0, 0])
    expect(heatColor(2 / 3)).toEqual([255, 255, 0])
    expect(heatColor(1)).toEqual([255, 255, 255])
  })

  it('clamps values outside 0-1', () => {
    expect(heatColor(-2)).toEqual([0, 0, 0])
    expect(heatColor(5)).toEqual([255, 255, 255])
  })
})

describe('distanceMapPixels', () => {
  it('paints the target color white and far colors black', () => {
    // 2x1 frame: one salamander pixel, one white pixel
    const frame = {
      width: 2,
      height: 1,
      data: new Uint8ClampedArray([0x66, 0x00, 0x05, 255, 255, 255, 255, 255]),
    }
    const pixels = distanceMapPixels(frame, 0x660005, 67)
    expect(Array.from(pixels.slice(0, 4))).toEqual([255, 255, 255, 255])
    expect(Array.from(pixels.slice(4, 8))).toEqual([0, 0, 0, 255])
  })

  it('works with threshold 0 without dividing by zero', () => {
    const frame = { width: 1, height: 1, data: new Uint8ClampedArray([1, 2, 3, 255]) }
    expect(Array.from(distanceMapPixels(frame, 0x010203, 0))).toEqual([255, 255, 255, 255])
  })
})
