import { describe, expect, it } from 'vitest'
import { isTracked, pointIndexAt } from '../../src/components/results/trackData'
import type { TrackPoint } from '../../src/types'

// 5 frames, 0.04 s apart (25 frames per second); frame 2 has no match
const points: TrackPoint[] = [
  { seconds: 0, x: 10, y: 10 },
  { seconds: 0.04, x: 12, y: 11 },
  { seconds: 0.08, x: -1, y: -1 },
  { seconds: 0.12, x: 15, y: 13 },
  { seconds: 0.16, x: 16, y: 14 },
]

describe('isTracked', () => {
  it('is false only for -1,-1 rows', () => {
    expect(isTracked(points[0])).toBe(true)
    expect(isTracked(points[2])).toBe(false)
  })
})

describe('pointIndexAt', () => {
  it('finds the frame showing at a time', () => {
    expect(pointIndexAt(points, 0)).toBe(0)
    expect(pointIndexAt(points, 0.05)).toBe(1)
    expect(pointIndexAt(points, 0.12)).toBe(3)
    expect(pointIndexAt(points, 99)).toBe(4)
  })

  it('returns -1 before the first frame or with no points', () => {
    expect(pointIndexAt(points, -1)).toBe(-1)
    expect(pointIndexAt([], 1)).toBe(-1)
  })

  it('matches a simple linear search on a long track', () => {
    const long = Array.from({ length: 12000 }, (_, i) => ({ seconds: i * 0.04, x: i, y: i }))
    for (const t of [0, 1.234, 100, 479.96, 500]) {
      const linear = long.findLastIndex((p) => p.seconds <= t)
      expect(pointIndexAt(long, t)).toBe(linear)
    }
  })
})
