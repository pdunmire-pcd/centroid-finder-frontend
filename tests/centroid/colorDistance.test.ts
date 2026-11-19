import { describe, expect, it } from 'vitest'
import { euclideanColorDistance, parseHexColor } from '../../src/centroid'

describe('euclideanColorDistance', () => {
  it('returns 0 for identical colors', () => {
    expect(euclideanColorDistance(0x123456, 0x123456)).toBe(0)
  })

  it('returns sqrt(3 * 255^2) for black vs white', () => {
    expect(euclideanColorDistance(0x000000, 0xffffff)).toBe(Math.sqrt(195075))
  })

  it('measures a single channel difference', () => {
    expect(euclideanColorDistance(0xff0000, 0x000000)).toBe(255)
    expect(euclideanColorDistance(0x00ff00, 0x000000)).toBe(255)
    expect(euclideanColorDistance(0x0000ff, 0x000000)).toBe(255)
  })

  it('combines channels with the Euclidean formula', () => {
    // r diff 3, g diff 4, b diff 0 -> 5
    expect(euclideanColorDistance(0x030400, 0x000000)).toBe(5)
  })

  it('is symmetric', () => {
    expect(euclideanColorDistance(0x123456, 0xabcdef)).toBe(
      euclideanColorDistance(0xabcdef, 0x123456),
    )
  })

  it('ignores the alpha byte like Java getRGB values', () => {
    // 0xFF123456 as a signed 32-bit int, the way Java's getRGB returns it
    expect(euclideanColorDistance(0xff123456 | 0, 0x123456)).toBe(0)
  })
})

describe('parseHexColor', () => {
  it('parses with or without # and in either case', () => {
    expect(parseHexColor('FFA200')).toBe(0xffa200)
    expect(parseHexColor('#ffa200')).toBe(0xffa200)
    expect(parseHexColor('#FfA200')).toBe(0xffa200)
  })

  it('rejects invalid colors', () => {
    expect(() => parseHexColor('#fff')).toThrow(RangeError)
    expect(() => parseHexColor('zzzzzz')).toThrow(RangeError)
    expect(() => parseHexColor('')).toThrow(RangeError)
  })
})
