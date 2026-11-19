import { describe, expect, it } from 'vitest'
import {
  MARKER_CANDIDATES,
  clientToPixel,
  contrastingMarkerColor,
  describeSpread,
  formatHex,
  formatRgb,
  formatSeconds,
  hexToRgb,
} from '../../src/components/color/colorUtils'

describe('formatHex / hexToRgb', () => {
  it('turns RGB into a lowercase hex string with #', () => {
    expect(formatHex([102, 0, 5])).toBe('#660005')
    expect(formatHex([255, 162, 0])).toBe('#ffa200')
  })

  it('reads hex with or without the #', () => {
    expect(hexToRgb('#660005')).toEqual([102, 0, 5])
    expect(hexToRgb('FFA200')).toEqual([255, 162, 0])
  })

  it('round-trips', () => {
    expect(hexToRgb(formatHex([1, 2, 3]))).toEqual([1, 2, 3])
  })

  it('rejects bad hex', () => {
    expect(() => hexToRgb('#12345')).toThrow(RangeError)
    expect(() => hexToRgb('zzzzzz')).toThrow(RangeError)
  })
})

describe('formatRgb / formatSeconds', () => {
  it('formats for display', () => {
    expect(formatRgb([102, 0, 5])).toBe('rgb(102, 0, 5)')
    expect(formatSeconds(1.234)).toBe('1.23 s')
  })
})

describe('contrastingMarkerColor', () => {
  it('picks cyan for the dark red salamander', () => {
    expect(contrastingMarkerColor('#660005')).toBe('#00e5ff')
  })

  it('picks magenta for a green object', () => {
    expect(contrastingMarkerColor('00ff00')).toBe('#ff00ff')
  })

  it('always returns one of the candidates', () => {
    expect(MARKER_CANDIDATES).toContain(contrastingMarkerColor('#ffffff'))
  })
})

describe('describeSpread', () => {
  it('uses plain words that get more worried as the spread grows', () => {
    expect(describeSpread(3)).toMatch(/^Very consistent/)
    expect(describeSpread(15)).toMatch(/^Consistent/)
    expect(describeSpread(40)).toMatch(/^Somewhat varied/)
    expect(describeSpread(80)).toMatch(/^Very varied/)
  })
})

describe('clientToPixel', () => {
  it('scales a click on a resized canvas back to frame pixels', () => {
    // a 1920x1080 frame shown 960x540: each screen pixel covers 2 frame pixels
    expect(clientToPixel(100, 50, 960, 540, 1920, 1080)).toEqual({ x: 200, y: 100 })
  })

  it('keeps clicks on the very edge inside the frame', () => {
    expect(clientToPixel(960, 540, 960, 540, 1920, 1080)).toEqual({ x: 1919, y: 1079 })
    expect(clientToPixel(-3, -3, 960, 540, 1920, 1080)).toEqual({ x: 0, y: 0 })
  })
})
