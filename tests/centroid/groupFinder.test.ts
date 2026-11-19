import { describe, expect, it } from 'vitest'
import { findConnectedGroups, toCsvRow } from '../../src/centroid'

const csv = (image: number[][]) => findConnectedGroups(image).map(toCsvRow)

describe('findConnectedGroups', () => {
  it('returns an empty list when there are no 1s', () => {
    expect(findConnectedGroups([[0, 0], [0, 0]])).toEqual([])
  })

  it('finds a single pixel', () => {
    expect(csv([[0, 0], [0, 1]])).toEqual(['1,1,1'])
  })

  it('connects horizontally and vertically', () => {
    expect(csv([
      [1, 1, 1],
      [0, 0, 1],
      [0, 0, 1],
    ])).toEqual(['5,1,0']) // x: (0+1+2+2+2)/5 = 1, y: (0+0+0+1+2)/5 = 0
  })

  it('does NOT connect diagonally', () => {
    expect(csv([
      [1, 0],
      [0, 1],
    ])).toEqual(['1,1,1', '1,0,0'])
  })

  it('uses integer division (truncation) for the centroid', () => {
    // x values 0 and 1 -> 1/2 = 0 ; y values 0 -> 0
    expect(csv([[1, 1]])).toEqual(['2,0,0'])
    // x values 0,1,2,3 -> 6/4 = 1
    expect(csv([[1, 1, 1, 1]])).toEqual(['4,1,0'])
  })

  it('uses x for columns and y for rows', () => {
    // (row:2, column:1) -> (x:1, y:2)
    expect(csv([
      [0, 0],
      [0, 0],
      [0, 1],
    ])).toEqual(['1,1,2'])
  })

  it('handles a group that wraps around (U shape)', () => {
    expect(csv([
      [1, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
    ])).toEqual(['7,1,1']) // x: 7/7 = 1, y: (0+1+2+0+1+2+2)/7 = 8/7 = 1
  })

  it('sorts by size descending', () => {
    expect(csv([
      [1, 0, 1, 1],
      [0, 0, 1, 1],
      [1, 1, 0, 0],
    ])).toEqual(['4,2,0', '2,0,2', '1,0,0'])
  })

  it('breaks size ties by larger x, then larger y (reverseOrder)', () => {
    expect(csv([
      [1, 0, 1],
      [0, 0, 0],
      [1, 0, 1],
    ])).toEqual(['1,2,2', '1,2,0', '1,0,2', '1,0,0'])
  })

  it('finds every separate group', () => {
    const groups = findConnectedGroups([
      [1, 0, 1, 0, 1],
      [0, 0, 0, 0, 0],
      [1, 0, 1, 0, 1],
    ])
    expect(groups).toHaveLength(6)
    expect(groups.every((g) => g.size === 1)).toBe(true)
  })

  it('handles a large single group without stack overflow', () => {
    const size = 500
    const image = Array.from({ length: size }, () =>
      new Array<number>(size).fill(1),
    )
    expect(csv(image)).toEqual([`${size * size},249,249`])
  })

  it('throws TypeError for null input or null rows', () => {
    expect(() => findConnectedGroups(null as unknown as number[][])).toThrow(
      TypeError,
    )
    expect(() =>
      findConnectedGroups([[1], null as unknown as number[]]),
    ).toThrow(TypeError)
  })

  it('throws RangeError for an empty array', () => {
    expect(() => findConnectedGroups([])).toThrow(RangeError)
  })

  it('throws RangeError for uneven rows', () => {
    expect(() => findConnectedGroups([[1, 0], [1]])).toThrow(RangeError)
  })

  it('throws RangeError for values other than 0 and 1', () => {
    expect(() => findConnectedGroups([[1, 2]])).toThrow(RangeError)
  })
})
