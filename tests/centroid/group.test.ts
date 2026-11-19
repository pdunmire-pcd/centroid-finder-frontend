import { describe, expect, it } from 'vitest'
import { compareGroups, toCsvRow, type Group } from '../../src/centroid'

const group = (size: number, x: number, y: number): Group => ({
  size,
  centroid: { x, y },
})

describe('compareGroups', () => {
  it('compares by size first', () => {
    expect(compareGroups(group(5, 0, 0), group(3, 9, 9))).toBe(1)
    expect(compareGroups(group(3, 9, 9), group(5, 0, 0))).toBe(-1)
  })

  it('then by centroid x', () => {
    expect(compareGroups(group(5, 2, 0), group(5, 1, 9))).toBe(1)
    expect(compareGroups(group(5, 1, 9), group(5, 2, 0))).toBe(-1)
  })

  it('then by centroid y', () => {
    expect(compareGroups(group(5, 2, 3), group(5, 2, 1))).toBe(1)
    expect(compareGroups(group(5, 2, 1), group(5, 2, 3))).toBe(-1)
  })

  it('returns 0 for equal groups', () => {
    expect(compareGroups(group(5, 2, 3), group(5, 2, 3))).toBe(0)
  })
})

describe('toCsvRow', () => {
  it('formats as size,x,y', () => {
    expect(toCsvRow(group(1234, 56, 78))).toBe('1234,56,78')
  })
})
