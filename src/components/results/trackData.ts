import type { TrackPoint } from '../../types'

// Pure helpers for the results page: finding the point at a time, and
// preparing the track for the chart and table. No React, so they are unit
// tested in tests/results/trackData.test.ts.

/** True if the JAR found the object in this frame (it writes -1,-1 when not). */
export function isTracked(point: TrackPoint): boolean {
  return point.x >= 0 && point.y >= 0
}

/**
 * Index of the frame showing at `time`: the last point whose seconds <= time.
 * Uses binary search (halving the range each step), because the real CSV has
 * ~12,000 rows and this runs many times per second while the video plays.
 * Returns -1 before the first point or when there are no points.
 */
export function pointIndexAt(points: TrackPoint[], time: number): number {
  let low = 0
  let high = points.length - 1
  let answer = -1
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    if (points[mid].seconds <= time) {
      answer = mid // mid is a candidate; look for a later one
      low = mid + 1
    } else {
      high = mid - 1
    }
  }
  return answer
}
