import { describe, expect, it } from 'vitest'
import { describeFrameRates } from '../../src/components/player/useFrameRates'

describe('describeFrameRates', () => {
  it('reports skipped frames while playing', () => {
    expect(describeFrameRates({ videoFps: 25, analysedFps: 12, playing: true })).toBe('analysing 12 of 25 fps')
  })

  it('says nothing when keeping up', () => {
    expect(describeFrameRates({ videoFps: 25, analysedFps: 25, playing: true })).toBeNull()
    expect(describeFrameRates({ videoFps: 25, analysedFps: 24, playing: true })).toBeNull()
  })

  it('says nothing while paused or before the first second', () => {
    expect(describeFrameRates({ videoFps: 25, analysedFps: 3, playing: false })).toBeNull()
    expect(describeFrameRates(null)).toBeNull()
  })
})
