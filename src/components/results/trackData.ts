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

// ---- Chart helpers ----

/** One point on the position chart. null = no match, so the line breaks there. */
export type ChartRow = { seconds: number; x: number | null; y: number | null }

/**
 * Makes the track small enough to draw quickly.
 *
 * How it works: a real CSV can have ~12,000 rows, but a chart is only about
 * 1,000 pixels wide, so drawing every row wastes time and looks the same.
 * We split the rows into equal "buckets" of `step` rows (step = rows / maxRows,
 * rounded up) and keep ONE row per bucket: its first row. If any row in the
 * bucket had no match we keep a gap (null) instead, so short losses of
 * tracking still break the line instead of being hidden.
 * The no-match bands and suspect marks are computed from ALL rows, so nothing
 * is lost there. With fewer rows than maxRows, every row is kept.
 */
export function downsampleForChart(points: TrackPoint[], maxRows = 1500): ChartRow[] {
  const step = Math.max(1, Math.ceil(points.length / maxRows))
  const rows: ChartRow[] = []
  for (let start = 0; start < points.length; start += step) {
    const bucket = points.slice(start, start + step)
    const first = bucket[0]
    if (bucket.every(isTracked)) {
      rows.push({ seconds: first.seconds, x: first.x, y: first.y })
    } else {
      rows.push({ seconds: first.seconds, x: null, y: null })
    }
  }
  return rows
}

/** A stretch of time with no match, for the shaded bands on the chart. */
export type TimeBand = { start: number; end: number }

/**
 * Groups neighbouring no-match rows into bands. A band ends where the next
 * tracked row starts (or one frame after the last row), so even a single
 * missed frame gets a visible width.
 */
export function noMatchBands(points: TrackPoint[]): TimeBand[] {
  const bands: TimeBand[] = []
  // Length of one frame, guessed from the first two rows (0.04 s at 25 fps)
  const frame = points.length > 1 ? points[1].seconds - points[0].seconds : 0.04
  let bandStart: number | null = null

  points.forEach((point, i) => {
    if (!isTracked(point) && bandStart === null) bandStart = point.seconds // a band begins
    if (isTracked(point) && bandStart !== null) {
      bands.push({ start: bandStart, end: point.seconds }) // the band ends here
      bandStart = null
    }
    if (i === points.length - 1 && bandStart !== null) {
      bands.push({ start: bandStart, end: point.seconds + frame }) // still open at the end
    }
  })
  return bands
}

/** Default for "suspect jump": a move bigger than this between frames is flagged. */
export const DEFAULT_MAX_JUMP_PX = 100

// ---- Table helpers ----

export type RowNote = 'No match' | 'Suspect jump' | null

/** One row of the CSV table: the point, its frame index, and why it is flagged. */
export type TableRow = { index: number; point: TrackPoint; note: RowNote }

/** Adds a note to every row: "No match" for -1,-1 rows, "Suspect jump" for suspect frames. */
export function buildTableRows(points: TrackPoint[], suspectIndexes: number[]): TableRow[] {
  const suspect = new Set(suspectIndexes) // Set.has() is fast, even with many suspects
  return points.map((point, index) => {
    let note: RowNote = null
    if (!isTracked(point)) note = 'No match'
    else if (suspect.has(index)) note = 'Suspect jump'
    return { index, point, note }
  })
}

/**
 * Which page (0-based) shows the frame `frameIndex`. If that exact frame is
 * not in `rows` (e.g. only flagged rows are shown), use the last row before it.
 */
export function pageForFrame(rows: TableRow[], frameIndex: number, rowsPerPage: number): number {
  let position = 0
  rows.forEach((row, i) => {
    if (row.index <= frameIndex) position = i
  })
  return Math.floor(position / rowsPerPage)
}
