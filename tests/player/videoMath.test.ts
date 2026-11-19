import { describe, expect, it } from 'vitest'
import {
  clamp,
  countFrames,
  estimateFps,
  formatTime,
  frameToTime,
  pickReadSize,
  timeToFrame,
} from '../../src/components/player/videoMath'

describe('timeToFrame / frameToTime', () => {
  it('finds the frame showing at a time', () => {
    expect(timeToFrame(0, 25)).toBe(0)
    expect(timeToFrame(0.039, 25)).toBe(0)
    expect(timeToFrame(0.04, 25)).toBe(1)
    expect(timeToFrame(1, 25)).toBe(25)
  })

  it('copes with floating point rounding', () => {
    // 0.12 * 25 is 2.9999999999999996 in JavaScript
    expect(timeToFrame(0.12, 25)).toBe(3)
  })

  it('seeks to the middle of a frame, which maps back to the same frame', () => {
    for (let frame = 0; frame < 300; frame++) {
      expect(timeToFrame(frameToTime(frame, 25), 25)).toBe(frame)
      expect(timeToFrame(frameToTime(frame, 29.97), 29.97)).toBe(frame)
    }
  })
})

describe('countFrames', () => {
  it('counts the frames of the sample video', () => {
    expect(countFrames(11, 25)).toBe(275)
  })

  it('is 0 before the duration is known', () => {
    expect(countFrames(0, 25)).toBe(0)
    expect(countFrames(NaN, 25)).toBe(0)
  })
})

describe('clamp', () => {
  it('keeps values in range', () => {
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(11, 0, 10)).toBe(10)
  })
})

describe('estimateFps', () => {
  it('turns a frame gap into frames per second', () => {
    expect(estimateFps(0.04)).toBe(25)
    expect(estimateFps(1001 / 30000)).toBe(29.97)
  })

  it('ignores gaps that cannot be a single frame', () => {
    expect(estimateFps(0)).toBeNull()
    expect(estimateFps(-0.04)).toBeNull()
    expect(estimateFps(2)).toBeNull()
  })
})

describe('formatTime', () => {
  it('shows minutes, seconds and hundredths', () => {
    expect(formatTime(0)).toBe('0:00.00')
    expect(formatTime(3.456)).toBe('0:03.45')
    expect(formatTime(75.5)).toBe('1:15.50')
  })

  it('shows 0 for unknown times', () => {
    expect(formatTime(NaN)).toBe('0:00.00')
  })
})

describe('pickReadSize', () => {
  it('reads big videos at a smaller size', () => {
    expect(pickReadSize(1920, 1080, 640)).toEqual({ width: 640, height: 360, scale: 1 / 3 })
  })

  it('reads small videos at full size', () => {
    expect(pickReadSize(320, 240, 640)).toEqual({ width: 320, height: 240, scale: 1 })
  })
})
