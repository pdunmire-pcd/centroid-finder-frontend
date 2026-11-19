// Port of Group.java and Coordinate.java.
//
// The top-left pixel is (x:0, y:0). Y increases downward and X increases to
// the right, so (row:4, column:7) is (x:7, y:4).

export interface Coordinate {
  readonly x: number
  readonly y: number
}

export interface Group {
  readonly size: number
  readonly centroid: Coordinate
}

// Same as Java's Integer.compare: returns -1, 0 or 1.
function compareInt(a: number, b: number): number {
  return a < b ? -1 : a > b ? 1 : 0
}

/**
 * Same as Group.compareTo: compares by size, then centroid x, then centroid y,
 * each ascending.
 */
export function compareGroups(a: Group, b: Group): number {
  let comp = compareInt(a.size, b.size)
  if (comp !== 0) return comp

  comp = compareInt(a.centroid.x, b.centroid.x)
  if (comp !== 0) return comp

  return compareInt(a.centroid.y, b.centroid.y)
}

/** Same as Group.toCsvRow: "size,x,y". */
export function toCsvRow(group: Group): string {
  return `${group.size},${group.centroid.x},${group.centroid.y}`
}
