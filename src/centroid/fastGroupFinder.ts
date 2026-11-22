// Fast version of groupFinder.ts for live video.
//
// It finds exactly the same groups, centroids and order as
// findConnectedGroups (the Java-matching reference), but works on a flat
// Uint8Array instead of a number[][] and uses an Int32Array as its stack.
//
// Why this is faster:
// - A flat typed array is one block of memory. number[][] is an array of
//   separate row arrays, so every image[y][x] does two lookups.
// - Each pixel is stored as ONE number, its index (y * width + x), instead of
//   a new { x, y } object. Creating millions of objects per frame is slow and
//   makes the garbage collector run often.
// - The stack is a fixed-size Int32Array with a "top" counter, so pushing and
//   popping never resizes an array.

import { compareGroups, type Group } from './group'

/** Smallest rectangle around a group, in pixel coordinates (inclusive). */
export interface GroupBounds {
  readonly minX: number
  readonly minY: number
  readonly maxX: number
  readonly maxY: number
}

/** A group together with its bounding box. */
export interface GroupWithBounds {
  readonly group: Group
  readonly bounds: GroupBounds
}

// Scratch arrays kept between calls so a 1080p frame does not allocate
// ~10 MB of new memory every time. They are replaced when the size changes.
let visited = new Uint8Array(0)
let stack = new Int32Array(0)

function getScratch(pixelCount: number): void {
  if (visited.length !== pixelCount) {
    visited = new Uint8Array(pixelCount)
    // Every pixel is pushed at most once (it is marked visited when pushed),
    // so a stack as long as the image can never overflow.
    stack = new Int32Array(pixelCount)
  } else {
    visited.fill(0)
  }
}

/**
 * Same as findConnectedGroupsFast, but also returns each group's bounding
 * box. The quality checks use the boxes to see if a group touches the edge.
 *
 * `binary` has one entry per pixel, row by row: binary[y * width + x].
 * Any non-zero value counts as "on".
 */
export function findConnectedGroupsWithBounds(
  binary: Uint8Array,
  width: number,
  height: number,
): GroupWithBounds[] {
  const pixelCount = width * height
  if (binary.length !== pixelCount) {
    throw new RangeError('binary length must be width * height')
  }
  getScratch(pixelCount)

  const results: GroupWithBounds[] = []

  // Go through every pixel in the same order as the reference (row by row).
  for (let start = 0; start < pixelCount; start++) {
    if (binary[start] === 0 || visited[start] === 1) continue

    // Start a new group with this pixel on the stack.
    visited[start] = 1
    let top = 0
    stack[top++] = start

    let count = 0
    let sumX = 0
    let sumY = 0
    let minX = width
    let minY = height
    let maxX = -1
    let maxY = -1

    while (top > 0) {
      // pop
      const index = stack[--top]
      const x = index % width
      const y = (index - x) / width

      count++
      sumX += x
      sumY += y
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y

      // Same neighbour order as the reference: right, left, down, up.
      // The order only changes which pixel is visited first, not the result,
      // but keeping it the same makes the two versions easy to compare.
      if (x + 1 < width) {
        const right = index + 1
        if (binary[right] !== 0 && visited[right] === 0) {
          visited[right] = 1
          stack[top++] = right
        }
      }
      if (x > 0) {
        const left = index - 1
        if (binary[left] !== 0 && visited[left] === 0) {
          visited[left] = 1
          stack[top++] = left
        }
      }
      if (y + 1 < height) {
        const down = index + width
        if (binary[down] !== 0 && visited[down] === 0) {
          visited[down] = 1
          stack[top++] = down
        }
      }
      if (y > 0) {
        const up = index - width
        if (binary[up] !== 0 && visited[up] === 0) {
          visited[up] = 1
          stack[top++] = up
        }
      }
    }

    results.push({
      group: {
        size: count,
        // integer division, like Java int / int
        centroid: { x: Math.trunc(sumX / count), y: Math.trunc(sumY / count) },
      },
      bounds: { minX, minY, maxX, maxY },
    })
  }

  // Descending, same as the reference. Array.sort is stable, so equal groups
  // keep the order they were found in, exactly like findConnectedGroups.
  results.sort((a, b) => compareGroups(b.group, a.group))
  return results
}

/**
 * Fast drop-in for findConnectedGroups on a flat binary image.
 * Same groups, same centroids (truncated), same order.
 */
export function findConnectedGroupsFast(
  binary: Uint8Array,
  width: number,
  height: number,
): Group[] {
  return findConnectedGroupsWithBounds(binary, width, height).map((r) => r.group)
}
