import { describe, expect, it } from 'vitest'
import {
  buildTableRows,
  pageForFrame,
  downsampleForChart,
  isTracked,
  noMatchBands,
  pointIndexAt,
} from '../../src/components/results/trackData'
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

describe('downsampleForChart', () => {
  it('keeps every row when there are few, with null for no match', () => {
    expect(downsampleForChart(points)).toEqual([
      { seconds: 0, x: 10, y: 10 },
      { seconds: 0.04, x: 12, y: 11 },
      { seconds: 0.08, x: null, y: null },
      { seconds: 0.12, x: 15, y: 13 },
      { seconds: 0.16, x: 16, y: 14 },
    ])
  })

  it('keeps one row per bucket for long tracks', () => {
    const long = Array.from({ length: 12000 }, (_, i) => ({ seconds: i * 0.04, x: i, y: i }))
    const rows = downsampleForChart(long, 1500)
    expect(rows).toHaveLength(1500) // 12000 / 8
    expect(rows[1]).toEqual({ seconds: 8 * 0.04, x: 8, y: 8 })
  })

  it('keeps a gap when any row in the bucket had no match', () => {
    const long = Array.from({ length: 100 }, (_, i) => ({ seconds: i, x: i === 13 ? -1 : i, y: i === 13 ? -1 : i }))
    const rows = downsampleForChart(long, 10) // buckets of 10 rows
    expect(rows[1]).toEqual({ seconds: 10, x: null, y: null })
    expect(rows[2]).toEqual({ seconds: 20, x: 20, y: 20 })
  })
})

describe('noMatchBands', () => {
  it('turns runs of no-match rows into time bands', () => {
    const track = [0, 1, -1, -1, 4, -1, 6].map((x, i) => ({ seconds: i, x, y: x }))
    expect(noMatchBands(track)).toEqual([
      { start: 2, end: 4 },
      { start: 5, end: 6 },
    ])
  })

  it('closes a band that runs to the end one frame after the last row', () => {
    const track = [0, -1, -1].map((x, i) => ({ seconds: i * 0.04, x, y: x }))
    const bands = noMatchBands(track)
    expect(bands).toHaveLength(1)
    expect(bands[0].start).toBeCloseTo(0.04)
    expect(bands[0].end).toBeCloseTo(0.12)
  })

  it('returns nothing when every frame is tracked', () => {
    expect(noMatchBands([{ seconds: 0, x: 1, y: 1 }])).toEqual([])
  })
})

describe('buildTableRows', () => {
  it('notes no-match rows and suspect jumps', () => {
    const rows = buildTableRows(points, [3])
    expect(rows.map((r) => r.note)).toEqual([null, null, 'No match', 'Suspect jump', null])
    expect(rows[4]).toEqual({ index: 4, point: points[4], note: null })
  })
})

describe('pageForFrame', () => {
  const many = buildTableRows(
    Array.from({ length: 100 }, (_, i) => ({ seconds: i, x: i % 10 === 0 ? -1 : i, y: 1 })),
    [],
  )

  it('finds the page that shows a frame', () => {
    expect(pageForFrame(many, 0, 25)).toBe(0)
    expect(pageForFrame(many, 24, 25)).toBe(0)
    expect(pageForFrame(many, 25, 25)).toBe(1)
    expect(pageForFrame(many, 99, 25)).toBe(3)
  })

  it('uses the last shown row before the frame when rows are filtered', () => {
    // Only frames 0, 10, 20 ... 90 are flagged; frame 35 is between 30 and 40
    const flagged = many.filter((r) => r.note !== null)
    expect(pageForFrame(flagged, 35, 2)).toBe(1) // 30 is the 4th flagged row -> page 1
    expect(pageForFrame(flagged, -1, 2)).toBe(0)
  })
})
