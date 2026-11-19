import { describe, expect, it } from 'vitest'
import { binaryToRgba } from '../../src/components/player/drawing'

describe('binaryToRgba', () => {
  it('turns 1 into white and 0 into black, always opaque', () => {
    const pixels = binaryToRgba(new Uint8Array([1, 0]))
    expect(Array.from(pixels)).toEqual([255, 255, 255, 255, 0, 0, 0, 255])
  })

  it('makes 4 bytes per pixel', () => {
    expect(binaryToRgba(new Uint8Array(6)).length).toBe(24)
  })
})
