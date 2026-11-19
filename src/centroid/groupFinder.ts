// Port of DfsBinaryGroupFinder.java.

import { compareGroups, type Coordinate, type Group } from './group'

/**
 * Finds connected groups of 1s in a binary image (a [y][x] array of 0s and 1s).
 *
 * - Pixels connect horizontally and vertically, NOT diagonally.
 * - A group's centroid is the average x and y of its pixels, using INTEGER
 *   division (truncation, like Java int / int).
 * - Groups are returned in DESCENDING order of compareGroups (same as
 *   Collections.sort(groups, Collections.reverseOrder())): biggest first, then
 *   larger x, then larger y. Both sorts are stable, so fully equal groups keep
 *   the order they were found in.
 *
 * Java throws NullPointerException / IllegalArgumentException. JavaScript has
 * neither, so TypeError and RangeError stand in for them, with the same
 * messages and in the same order.
 */
export function findConnectedGroups(image: number[][]): Group[] {
  if (image == null) throw new TypeError('image is null!')
  // null row
  for (let row = 0; row < image.length; row++) {
    if (image[row] == null) {
      throw new TypeError('null in row')
    }
  }
  // empty array
  if (image.length === 0) throw new RangeError('array is empty')
  // different length rows
  for (let rowNum = 0; rowNum < image.length; rowNum++) {
    if (image[rowNum].length !== image[0].length) {
      throw new RangeError('all row lengths must be the same')
    }
  }
  // values must be 1 or 0
  for (let row = 0; row < image.length; row++) {
    for (let col = 0; col < image[row].length; col++) {
      if (image[row][col] !== 0 && image[row][col] !== 1) {
        throw new RangeError('values can only be 1 and 0')
      }
    }
  }

  const height = image.length
  const width = image[0].length
  const visited: boolean[][] = Array.from({ length: height }, () =>
    new Array<boolean>(width).fill(false),
  )
  // Array push/pop is last-in-first-out, same as ArrayDeque.push/pop.
  const workStack: Coordinate[] = []
  const groups: Group[] = []

  const pushIfUnvisited = (nx: number, ny: number) => {
    if (
      ny >= 0 && ny < height &&
      nx >= 0 && nx < width &&
      image[ny][nx] === 1 &&
      !visited[ny][nx]
    ) {
      visited[ny][nx] = true
      workStack.push({ x: nx, y: ny })
    }
  }

  // Go through every pixel
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (image[row][col] === 1 && !visited[row][col]) {
        visited[row][col] = true
        workStack.push({ x: col, y: row })
        let count = 0
        let sumX = 0
        let sumY = 0

        while (workStack.length > 0) {
          const currentPixel = workStack.pop()!
          count++
          sumX += currentPixel.x
          sumY += currentPixel.y

          pushIfUnvisited(currentPixel.x + 1, currentPixel.y) // right
          pushIfUnvisited(currentPixel.x - 1, currentPixel.y) // left
          pushIfUnvisited(currentPixel.x, currentPixel.y + 1) // down
          pushIfUnvisited(currentPixel.x, currentPixel.y - 1) // up
        }

        groups.push({
          size: count,
          centroid: {
            x: Math.trunc(sumX / count),
            y: Math.trunc(sumY / count),
          },
        })
      }
    }
  }

  // descending, same as Collections.reverseOrder()
  groups.sort((a, b) => compareGroups(b, a))
  return groups
}
