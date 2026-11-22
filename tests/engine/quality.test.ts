import { describe, expect, it } from 'vitest'
import {
  analyzeFrame,
  checkFrameQuality,
  COMPETING_GROUP_RATIO,
  MANY_GROUPS_COUNT,
  TOO_MANY_MATCHING_FRACTION,
  type FrameAnalysis,
} from '../../src/centroid/engine'
import { solidImage } from './helpers'

/** Analyses a 0/1 drawing given as strings, e.g. ['.##.', '....'] ('#' = match). */
function analyse(rows: string[]): FrameAnalysis {
  const width = rows[0].length
  const height = rows.length
  const image = solidImage(width, height, 0x000000)
  rows.forEach((row, y) => {
    for (let x = 0; x < width; x++) {
      if (row[x] === '#') image.data[(y * width + x) * 4] = 255 // red = match
    }
  })
  return analyzeFrame(image, 0xff0000, 10)
}

const codes = (analysis: FrameAnalysis) => checkFrameQuality(analysis).map((w) => w.code)

describe('checkFrameQuality', () => {
  it('has sensible named limits', () => {
    expect(TOO_MANY_MATCHING_FRACTION).toBe(0.2)
    expect(COMPETING_GROUP_RATIO).toBe(0.5)
    expect(MANY_GROUPS_COUNT).toBe(50)
  })

  it('no-match when nothing matches (and nothing else)', () => {
    expect(codes(analyse(['....', '....']))).toEqual(['no-match'])
  })

  it('no warnings for one small group in the middle', () => {
    expect(codes(analyse([
      '..........',
      '....##....',
      '....##....',
      '..........',
    ]))).toEqual([])
  })

  it('too-many-matching above 20% of the frame', () => {
    // 9 of 36 pixels = 25%
    expect(codes(analyse([
      '......',
      '.###..',
      '.###..',
      '.###..',
      '......',
      '......',
    ]))).toEqual(['too-many-matching'])
  })

  it('touches-edge when the largest group reaches any side', () => {
    const middle = ['.........', '.........', '.........', '.........']
    const withRow = (y: number, row: string) => middle.map((r, i) => (i === y ? row : r))
    expect(codes(analyse(withRow(0, '...#.....')))).toEqual(['touches-edge']) // top
    expect(codes(analyse(withRow(3, '...#.....')))).toEqual(['touches-edge']) // bottom
    expect(codes(analyse(withRow(1, '#........')))).toEqual(['touches-edge']) // left
    expect(codes(analyse(withRow(2, '........#')))).toEqual(['touches-edge']) // right
  })

  it('touches-edge also works on a FrameAnalysis without bounds (computed from binary)', () => {
    const analysis = analyse(['....', '...#', '....'])
    const { bounds, ...withoutBounds } = analysis
    expect(bounds).toBeDefined()
    expect(codes(withoutBounds)).toEqual(['touches-edge'])
  })

  it('competing-group when the second group is at least half the largest', () => {
    expect(codes(analyse([
      '............',
      '.####...##..',
      '............',
    ]))).toEqual(['competing-group'])
    // 1 is less than half of 4: fine
    expect(codes(analyse([
      '............',
      '.####....#..',
      '............',
    ]))).toEqual([])
  })

  it('many-groups when there are more than 50 groups', () => {
    // a checkerboard-like pattern of single pixels: 51 groups in a big frame
    const width = 2 * 51 + 1
    const rows = ['.'.repeat(width), '.#'.repeat(51) + '.', '.'.repeat(width)]
    for (let k = 0; k < 40; k++) rows.push('.'.repeat(width))
    // all groups have size 1, so competing-group fires too
    expect(codes(analyse(rows))).toEqual(['competing-group', 'many-groups'])
  })

  it('every warning has a message and a fix', () => {
    const warnings = checkFrameQuality(analyse(['##', '##']))
    expect(warnings.length).toBeGreaterThan(0)
    for (const w of warnings) {
      expect(w.message.length).toBeGreaterThan(10)
      expect(w.fix.length).toBeGreaterThan(10)
    }
  })

  it('works on an analysis made at scale < 1', () => {
    const image = solidImage(200, 100, 0x000000)
    // a red block touching the right edge
    for (let y = 40; y < 60; y++) {
      for (let x = 180; x < 200; x++) image.data[(y * 200 + x) * 4] = 255
    }
    expect(codes(analyzeFrame(image, 0xff0000, 10, 0.25))).toEqual(['touches-edge'])
  })
})
