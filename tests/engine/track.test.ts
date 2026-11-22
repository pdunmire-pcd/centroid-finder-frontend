import { describe, expect, it } from 'vitest'
import { findSuspectFrames, parseTrackCsv, summarizeTrack } from '../../src/centroid/engine'
import type { TrackPoint } from '../../src/types'

const pt = (seconds: number, x: number, y: number): TrackPoint => ({ seconds, x, y })

describe('parseTrackCsv', () => {
  it('reads the real JAR format (no header)', () => {
    expect(parseTrackCsv('0.000,1080,581\n0.040,1082,580\n0.080,-1,-1\n')).toEqual([
      pt(0, 1080, 581),
      pt(0.04, 1082, 580),
      pt(0.08, -1, -1),
    ])
  })

  it('skips a seconds,x,y header in any case and with spaces', () => {
    expect(parseTrackCsv('seconds,x,y\n0,1,2')).toEqual([pt(0, 1, 2)])
    expect(parseTrackCsv(' Seconds , X , Y \n0,1,2')).toEqual([pt(0, 1, 2)])
  })

  it('handles CRLF, lone CR, blank lines and spaces around values', () => {
    expect(parseTrackCsv('0,1,2\r\n\r\n 0.04 , 3 , 4 \r0.08,5,6\n\n')).toEqual([
      pt(0, 1, 2),
      pt(0.04, 3, 4),
      pt(0.08, 5, 6),
    ])
  })

  it('skips a byte-order mark, broken rows and ignores extra columns', () => {
    expect(parseTrackCsv('\uFEFF0,1,2\n0.04,abc,4\n0.08,5\n0.12,7,8,extra\n0.16,,9')).toEqual([
      pt(0, 1, 2),
      pt(0.12, 7, 8),
    ])
  })

  it('returns an empty list for empty text', () => {
    expect(parseTrackCsv('')).toEqual([])
  })

  it('parses 25 rows per second in order', () => {
    const lines: string[] = []
    for (let k = 0; k < 250; k++) lines.push(`${(k * 0.04).toFixed(3)},${k},${k * 2}`)
    const points = parseTrackCsv(lines.join('\n'))
    expect(points).toHaveLength(250)
    expect(points[249]).toEqual(pt(9.96, 249, 498))
  })
})

describe('findSuspectFrames', () => {
  it('flags big jumps, skipping no-match frames', () => {
    const points = [pt(0, 10, 10), pt(0.04, 12, 10), pt(0.08, -1, -1), pt(0.12, 200, 10), pt(0.16, 201, 10)]
    expect(findSuspectFrames(points, 50)).toEqual([3])
  })

  it('flags points on the frame edge when a frame size is given', () => {
    const points = [pt(0, 0, 500), pt(0.04, 5, 500), pt(0.08, 1919, 500), pt(0.12, 900, 1079), pt(0.16, 900, 0)]
    expect(findSuspectFrames(points, 10_000)).toEqual([])
    expect(findSuspectFrames(points, 10_000, { width: 1920, height: 1080 })).toEqual([0, 2, 3, 4])
  })

  it('lists a frame once even if it both jumps and sits on the edge', () => {
    const points = [pt(0, 500, 500), pt(0.04, 1919, 500)]
    expect(findSuspectFrames(points, 100, { width: 1920, height: 1080 })).toEqual([1])
  })

  it('never flags no-match frames as on the edge', () => {
    expect(findSuspectFrames([pt(0, -1, -1)], 10, { width: 100, height: 100 })).toEqual([])
  })
})

describe('summarizeTrack', () => {
  it('summarizes a track with a gap', () => {
    const points = [
      pt(0, 0, 0), pt(0.04, 3, 4), pt(0.08, -1, -1), pt(0.12, -1, -1), pt(0.16, 3, 10),
    ]
    const summary = summarizeTrack(points)
    expect(summary.frames).toBe(5)
    expect(summary.noMatch).toBe(2)
    expect(summary.trackedPct).toBeCloseTo(60)
    expect(summary.distancePx).toBeCloseTo(11) // 5 + 6
    expect(summary.durationSeconds).toBeCloseTo(0.16)
    expect(summary.avgSpeedPxPerSec).toBeCloseTo(11 / 0.16)
    expect(summary.frameIntervalSeconds).toBeCloseTo(0.04)
    expect(summary.longestGapFrames).toBe(2)
    expect(summary.longestGapSeconds).toBeCloseTo(0.08)
  })

  it('handles empty and single-row tracks', () => {
    expect(summarizeTrack([])).toMatchObject({ frames: 0, trackedPct: 0, durationSeconds: 0, longestGapFrames: 0 })
    expect(summarizeTrack([pt(0, -1, -1)])).toMatchObject({
      frames: 1, noMatch: 1, avgSpeedPxPerSec: 0, frameIntervalSeconds: 0, longestGapFrames: 1,
    })
  })
})
