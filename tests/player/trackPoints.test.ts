import { describe, expect, it } from 'vitest'
import {
  addTrackPoint,
  findNearestPoint,
  isNoMatch,
  toTrackPoint,
  trailOpacity,
} from '../../src/components/player/trackPoints'

describe('toTrackPoint', () => {
  it('scales the centroid back up to video pixels', () => {
    expect(toTrackPoint({ x: 100, y: 50 }, 1.2, 1 / 3)).toEqual({ seconds: 1.2, x: 300, y: 150 })
  })

  it('uses -1, -1 when nothing matched, like the JAR', () => {
    expect(toTrackPoint(null, 0.4, 0.5)).toEqual({ seconds: 0.4, x: -1, y: -1 })
  })
})

describe('addTrackPoint', () => {
  it('keeps points sorted by time', () => {
    let points = addTrackPoint([], { seconds: 0.08, x: 1, y: 1 })
    points = addTrackPoint(points, { seconds: 0.0, x: 2, y: 2 })
    points = addTrackPoint(points, { seconds: 0.04, x: 3, y: 3 })
    expect(points.map((p) => p.seconds)).toEqual([0, 0.04, 0.08])
  })

  it('replaces the point for a frame that was recorded before', () => {
    const points = addTrackPoint([{ seconds: 0.04, x: 1, y: 1 }], { seconds: 0.04, x: 9, y: 9 })
    expect(points).toEqual([{ seconds: 0.04, x: 9, y: 9 }])
  })

  it('does not change the old array', () => {
    const old = [{ seconds: 0, x: 1, y: 1 }]
    addTrackPoint(old, { seconds: 1, x: 2, y: 2 })
    expect(old).toHaveLength(1)
  })
})

describe('trailOpacity', () => {
  it('is 1 for the newest point and fades to 0.15', () => {
    expect(trailOpacity(0, 10)).toBe(1)
    expect(trailOpacity(5, 10)).toBeCloseTo(0.575)
    expect(trailOpacity(10, 10)).toBeCloseTo(0.15)
    expect(trailOpacity(20, 10)).toBeCloseTo(0.15)
  })

  it('is 1 when there is no trail yet', () => {
    expect(trailOpacity(0, 0)).toBe(1)
  })
})

describe('isNoMatch', () => {
  it('spots -1, -1 points', () => {
    expect(isNoMatch({ seconds: 0, x: -1, y: -1 })).toBe(true)
    expect(isNoMatch({ seconds: 0, x: 0, y: 0 })).toBe(false)
  })
})

describe('findNearestPoint', () => {
  const points = [
    { seconds: 0, x: 10, y: 10 },
    { seconds: 1, x: -1, y: -1 },
    { seconds: 2, x: 100, y: 100 },
  ]

  it('finds the closest tracked point', () => {
    expect(findNearestPoint(points, 95, 98, 20)).toEqual(points[2])
  })

  it('returns null when the click is too far from every point', () => {
    expect(findNearestPoint(points, 50, 50, 20)).toBeNull()
  })

  it('never returns a no-match point', () => {
    expect(findNearestPoint(points, -1, -1, 5)).toBeNull()
  })
})
