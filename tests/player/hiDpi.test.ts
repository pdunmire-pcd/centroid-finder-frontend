import { describe, expect, it } from 'vitest'
import { backingStoreSize, drawingScale, MAX_BACKING_SIDE, screenToLogical } from '../../src/components/shared/hiDpi'
import { clientToPixel } from '../../src/components/color/colorUtils'

// The high-DPI canvases draw in video pixels on a canvas that has
// (size on screen x devicePixelRatio) real pixels. These tests check that the
// two conversions agree, so a centroid is drawn exactly where a click on it
// would be reported.

describe('backingStoreSize', () => {
  it('is the CSS size times the device pixel ratio', () => {
    expect(backingStoreSize(640, 360, 2)).toEqual({ width: 1280, height: 720 })
    expect(backingStoreSize(640, 360, 3)).toEqual({ width: 1920, height: 1080 })
  })

  it('rounds fractional CSS sizes and ratios (e.g. browser zoom 110%)', () => {
    expect(backingStoreSize(333.3, 187.5, 1.1)).toEqual({ width: 367, height: 206 })
  })

  it('never goes below 1x, even when zoomed out', () => {
    expect(backingStoreSize(640, 360, 0.5)).toEqual({ width: 640, height: 360 })
  })

  it('caps very big canvases but keeps the shape', () => {
    const size = backingStoreSize(2560, 1440, 3)
    expect(size.width).toBe(MAX_BACKING_SIDE)
    expect(size.width / size.height).toBeCloseTo(2560 / 1440, 2)
  })
})

describe('drawingScale', () => {
  it('maps a video pixel onto the right backing-store pixel', () => {
    // a 1920x1080 video shown 640 CSS px wide on a 2x screen
    const backing = backingStoreSize(640, 360, 2)
    const { scaleX, scaleY } = drawingScale(backing, { width: 1920, height: 1080 })
    // the centroid (960, 540) is the middle of the video ...
    expect(960 * scaleX).toBe(backing.width / 2)
    expect(540 * scaleY).toBe(backing.height / 2)
    // ... and the bottom-right corner stays the bottom-right corner
    expect(1920 * scaleX).toBe(backing.width)
    expect(1080 * scaleY).toBe(backing.height)
  })
})

describe('screenToLogical', () => {
  const shown = { width: 640, height: 360 }
  const video = { width: 1920, height: 1080 }

  it('turns a click in CSS pixels into video pixels', () => {
    expect(screenToLogical(320, 180, shown, video)).toEqual({ x: 960, y: 540 })
    expect(screenToLogical(0, 0, shown, video)).toEqual({ x: 0, y: 0 })
  })

  it('does not depend on the device pixel ratio', () => {
    // The click maths only uses the size on screen. Whatever the backing
    // store is (1x, 2x, 3x), a click lands on the same video pixel.
    for (const dpr of [1, 2, 3]) {
      const backing = backingStoreSize(shown.width, shown.height, dpr)
      const { scaleX } = drawingScale(backing, video)
      const click = screenToLogical(100, 50, shown, video)
      expect(click).toEqual({ x: 300, y: 150 })
      // and drawing at that video pixel lands under the cursor:
      // backing pixel / dpr = CSS pixel
      expect((click.x * scaleX) / dpr).toBeCloseTo(100, 6)
    }
  })

  it('agrees with the color sampler\'s clientToPixel (which also rounds down and clamps)', () => {
    const { x, y } = screenToLogical(100, 50, { width: 960, height: 540 }, video)
    expect(clientToPixel(100, 50, 960, 540, 1920, 1080)).toEqual({ x: Math.floor(x), y: Math.floor(y) })
  })
})
