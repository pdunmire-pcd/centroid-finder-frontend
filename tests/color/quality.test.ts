import { describe, expect, it } from 'vitest'
import type { FrameAnalysis } from '../../src/centroid/engine'
import { computeLiveStats, warningSeverity } from '../../src/components/quality/qualityUtils'

/** A FrameAnalysis with only the fields computeLiveStats reads. */
function analysis(groupSizes: number[], matchingPixels: number): FrameAnalysis {
  return {
    groups: groupSizes.map((size, i) => ({ size, centroid: { x: i * 10, y: i * 5 } })),
    binary: new Uint8Array(100),
    width: 10,
    height: 10,
    matchingPixels,
  }
}

describe('computeLiveStats', () => {
  it('reports percent, count, largest and ratio', () => {
    const stats = computeLiveStats(analysis([40, 10], 50))
    expect(stats.matchingPercent).toBe(50)
    expect(stats.groupCount).toBe(2)
    expect(stats.largest).toEqual({ size: 40, centroid: { x: 0, y: 0 } })
    expect(stats.secondToLargestRatio).toBe(0.25)
  })

  it('has no ratio with a single group', () => {
    expect(computeLiveStats(analysis([40], 40)).secondToLargestRatio).toBeNull()
  })

  it('handles an empty frame result', () => {
    const stats = computeLiveStats(analysis([], 0))
    expect(stats.largest).toBeNull()
    expect(stats.groupCount).toBe(0)
    expect(stats.matchingPercent).toBe(0)
  })
})

describe('warningSeverity', () => {
  it('treats no match and too many matching as errors', () => {
    expect(warningSeverity('no-match')).toBe('error')
    expect(warningSeverity('too-many-matching')).toBe('error')
  })

  it('treats the rest as warnings', () => {
    expect(warningSeverity('touches-edge')).toBe('warning')
    expect(warningSeverity('competing-group')).toBe('warning')
    expect(warningSeverity('many-groups')).toBe('warning')
  })
})
