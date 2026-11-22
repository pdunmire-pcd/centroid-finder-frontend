// Pure helpers for the trajectory: recording points while the video plays,
// fading old points, and finding the point the user clicked.

import type { Coordinate } from '../../centroid'
import type { TrackPoint } from '../../types'

/** Two points closer in time than this are the same frame (fine up to 100 fps). */
const SAME_FRAME_SECONDS = 0.005

/** Two points further apart than this are not joined by a line. */
export const MAX_GAP_SECONDS = 1

/**
 * Turns a centroid from a (possibly smaller) analysed frame into a point in
 * full video pixels, like a CSV row. No centroid -> (-1, -1), like the JAR.
 */
export function toTrackPoint(centroid: Coordinate | null, seconds: number, scale: number): TrackPoint {
  if (!centroid) return { seconds, x: -1, y: -1 }
  return { seconds, x: Math.round(centroid.x / scale), y: Math.round(centroid.y / scale) }
}

/**
 * Adds a point and keeps the list sorted by time. If we already have a point
 * for that frame (e.g. the user played the same part twice), it is replaced.
 * Returns a new array, so React sees the change.
 */
export function addTrackPoint(points: TrackPoint[], point: TrackPoint): TrackPoint[] {
  const others = points.filter((p) => Math.abs(p.seconds - point.seconds) >= SAME_FRAME_SECONDS)
  const insertAt = others.findIndex((p) => p.seconds > point.seconds)
  if (insertAt === -1) return [...others, point]
  return [...others.slice(0, insertAt), point, ...others.slice(insertAt)]
}

/**
 * How visible a part of the trail is: 1 for the newest point, fading to 0.15
 * for the oldest. `age` and `trailLength` are in seconds.
 */
export function trailOpacity(age: number, trailLength: number): number {
  if (trailLength <= 0) return 1
  const fraction = Math.min(1, Math.max(0, age / trailLength))
  return 1 - fraction * 0.85
}

/** True when nothing matched in that frame (the JAR writes -1, -1). */
export function isNoMatch(point: TrackPoint): boolean {
  return point.x < 0 || point.y < 0
}

/**
 * The tracked point closest to (x, y), if it is within maxDistance pixels.
 * No-match points are skipped.
 */
export function findNearestPoint(
  points: TrackPoint[],
  x: number,
  y: number,
  maxDistance: number,
): TrackPoint | null {
  let best: TrackPoint | null = null
  let bestDistance = maxDistance
  for (const point of points) {
    if (isNoMatch(point)) continue
    const distance = Math.hypot(point.x - x, point.y - y)
    if (distance <= bestDistance) {
      best = point
      bestDistance = distance
    }
  }
  return best
}
