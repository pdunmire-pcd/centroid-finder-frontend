import { describe, expect, it } from 'vitest'
import {
  findConnectedGroups,
  findConnectedGroupsFast,
  findConnectedGroupsWithBounds,
  toCsvRow,
} from '../../src/centroid'

/** Turns [y][x] rows into the flat form the fast finder takes. */
function flatten(rows: number[][]): { binary: Uint8Array; width: number; height: number } {
  const height = rows.length
  const width = rows[0].length
  const binary = new Uint8Array(width * height)
  rows.forEach((row, y) => row.forEach((value, x) => { binary[y * width + x] = value }))
  return { binary, width, height }
}

const fastCsv = (rows: number[][]) => {
  const { binary, width, height } = flatten(rows)
  return findConnectedGroupsFast(binary, width, height).map(toCsvRow)
}

describe('findConnectedGroupsFast', () => {
  it('returns an empty list when there are no 1s', () => {
    expect(fastCsv([[0, 0], [0, 0]])).toEqual([])
  })

  it('connects horizontally and vertically but not diagonally', () => {
    expect(fastCsv([
      [1, 1, 1],
      [0, 0, 1],
      [1, 0, 1],
    ])).toEqual(['5,1,0', '1,0,2'])
  })

  it('does not wrap around from the end of one row to the next', () => {
    // (2,0) and (0,1) are next to each other in the flat array, but not in the image
    expect(fastCsv([
      [0, 0, 1],
      [1, 0, 0],
    ])).toEqual(['1,2,0', '1,0,1'])
  })

  it('matches the reference on a small mixed image', () => {
    const rows = [
      [1, 0, 1, 1, 0],
      [1, 0, 0, 1, 0],
      [0, 1, 1, 1, 0],
      [0, 0, 0, 0, 1],
    ]
    const { binary, width, height } = flatten(rows)
    expect(findConnectedGroupsFast(binary, width, height)).toEqual(findConnectedGroups(rows))
  })

  it('can be called again with a different size (scratch arrays are resized)', () => {
    expect(fastCsv([[1]])).toEqual(['1,0,0'])
    expect(fastCsv([[1, 1], [1, 1]])).toEqual(['4,0,0'])
    expect(fastCsv([[1]])).toEqual(['1,0,0'])
  })

  it('rejects a binary array of the wrong length', () => {
    expect(() => findConnectedGroupsFast(new Uint8Array(3), 2, 2)).toThrow(RangeError)
  })
})

describe('findConnectedGroupsWithBounds', () => {
  it('gives the bounding box of each group', () => {
    const { binary, width, height } = flatten([
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 1],
    ])
    const results = findConnectedGroupsWithBounds(binary, width, height)
    expect(results.map((r) => r.bounds)).toEqual([
      { minX: 1, minY: 0, maxX: 2, maxY: 2 },
      { minX: 3, minY: 2, maxX: 3, maxY: 2 },
    ])
  })
})
