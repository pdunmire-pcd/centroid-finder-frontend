import { describe, expect, it } from 'vitest'
import { summaryTiles } from '../../src/components/results/summary'
import { summarizeTrack } from '../../src/centroid/engine'

describe('summaryTiles', () => {
  it('formats the six summary numbers with units', () => {
    // 4 frames, one with no match; moves 3-4-5 triangles = 5 px per step
    const summary = summarizeTrack([
      { seconds: 0, x: 0, y: 0 },
      { seconds: 1, x: 3, y: 4 },
      { seconds: 2, x: -1, y: -1 },
      { seconds: 3, x: 6, y: 8 },
    ])
    const tiles = summaryTiles(summary)
    const byLabel = Object.fromEntries(tiles.map((t) => [t.label, `${t.value}${t.unit ?? ''}`]))

    expect(tiles).toHaveLength(6)
    expect(byLabel).toEqual({
      Frames: '4',
      Tracked: '75.0%',
      'No-match frames': '1',
      Duration: '3.00s',
      'Distance travelled': '10px',
      'Average speed': '3.3px/s',
    })
  })

  it('uses thousands separators for big numbers', () => {
    const summary = { frames: 12000, trackedPct: 100, noMatch: 0, distancePx: 45678.9, avgSpeedPxPerSec: 95.2, durationSeconds: 479.96 }
    expect(summaryTiles(summary)[0].value).toBe('12,000')
    expect(summaryTiles(summary)[4].value).toBe('45,679')
  })
})
