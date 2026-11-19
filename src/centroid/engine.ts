// Engine functions shared by the Analyze page, color tools and results pages.
//
// The signatures here are a shared contract: other pages call them, so they
// never change (new parameters and fields are only ever optional). The insides
// use the fast flat-array code in fastBinarizer.ts and fastGroupFinder.ts.

import type { RgbaImage } from './binarizer'
import { euclideanColorDistance } from './colorDistance'
import { downscaleNearest, normalizeScale, scaleGroupsUp } from './downscale'
import { binarizeInto } from './fastBinarizer'
import { findConnectedGroupsWithBounds, type GroupBounds } from './fastGroupFinder'
import type { Group } from './group'
import type { RgbTriple, TrackPoint, Warning } from '../types'

/** Everything one analysed frame gives back. */
export type FrameAnalysis = {
  /**
   * Biggest first, same order as findConnectedGroups. Centroids and sizes are
   * always in FULL-SIZE frame coordinates, even when `scale` < 1.
   */
  groups: Group[]
  /** width * height entries, 1 = within the threshold */
  binary: Uint8Array
  /** size of `binary` (smaller than the frame when scale < 1) */
  width: number
  height: number
  /** how many entries of `binary` are 1 */
  matchingPixels: number
  /** bounding box of each group, same order as `groups`, full-size coordinates */
  bounds?: GroupBounds[]
  /** size of the original frame (the coordinate system of `groups`) */
  sourceWidth?: number
  sourceHeight?: number
  /** the scale that was actually used, in (0, 1] */
  scale?: number
}

/**
 * Binarizes a frame and finds its groups, using the fast flat-array path
 * (binarizeInto + findConnectedGroupsWithBounds).
 *
 * At scale = 1 (the default) the groups are EXACTLY the same as
 * toBinaryArray + findConnectedGroups, i.e. the same as the Java backend.
 *
 * `scale` in (0, 1) analyses a smaller nearest-neighbour copy (e.g. 0.5 = half
 * width and half height, about 4x less work) and scales centroids, sizes and
 * bounds back up to full-size coordinates. Those results are APPROXIMATE:
 * centroids are accurate to about 1 / scale pixels and very thin parts of an
 * object can be missed. `binary`, `width`, `height` and `matchingPixels`
 * describe the smaller copy. Invalid scales are treated as 1.
 */
export function analyzeFrame(
  frame: RgbaImage,
  color: number,
  threshold: number,
  scale = 1,
): FrameAnalysis {
  const usedScale = normalizeScale(scale)
  const image = usedScale === 1 ? frame : downscaleNearest(frame, usedScale)

  const { binary, matchingPixels } = binarizeInto(image, color, threshold)
  let results = findConnectedGroupsWithBounds(binary, image.width, image.height)
  if (image !== frame) {
    results = scaleGroupsUp(results, image.width, image.height, frame.width, frame.height)
  }

  return {
    groups: results.map((r) => r.group),
    binary,
    width: image.width,
    height: image.height,
    matchingPixels,
    bounds: results.map((r) => r.bounds),
    sourceWidth: frame.width,
    sourceHeight: frame.height,
    scale: usedScale,
  }
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}

/** Median color of the size x size square centred on (x, y), clipped to the frame. */
export function sampleRegion(frame: RgbaImage, x: number, y: number, size: number): RgbTriple {
  const half = Math.floor(size / 2)
  const r: number[] = []
  const g: number[] = []
  const b: number[] = []
  for (let yy = Math.max(0, y - half); yy <= Math.min(frame.height - 1, y + half); yy++) {
    for (let xx = Math.max(0, x - half); xx <= Math.min(frame.width - 1, x + half); xx++) {
      const i = (yy * frame.width + xx) * 4
      r.push(frame.data[i])
      g.push(frame.data[i + 1])
      b.push(frame.data[i + 2])
    }
  }
  return [median(r), median(g), median(b)]
}

export function rgbToInt([r, g, b]: RgbTriple): number {
  return (r << 16) | (g << 8) | b
}

export function rgbToHex(rgb: RgbTriple): string {
  return rgbToInt(rgb).toString(16).padStart(6, '0')
}

export type SampleSummary = { mean: RgbTriple; maxDistance: number }

/** Mean of the samples, and how far the furthest sample is from that mean. */
export function summarizeSamples(samples: RgbTriple[]): SampleSummary {
  if (samples.length === 0) throw new RangeError('no samples')
  const sum = samples.reduce((acc, s) => [acc[0] + s[0], acc[1] + s[1], acc[2] + s[2]], [0, 0, 0])
  const mean: RgbTriple = [
    Math.round(sum[0] / samples.length),
    Math.round(sum[1] / samples.length),
    Math.round(sum[2] / samples.length),
  ]
  const meanInt = rgbToInt(mean)
  const maxDistance = Math.max(...samples.map((s) => euclideanColorDistance(rgbToInt(s), meanInt)))
  return { mean, maxDistance }
}

/**
 * Threshold that includes every sample plus a margin, clamped to 1-442.
 * The binarizer uses distance < threshold, hence the + 1.
 */
export function suggestThreshold(summary: SampleSummary, margin: number): number {
  return Math.min(442, Math.max(1, Math.ceil(summary.maxDistance + margin) + 1))
}

/** Counts of pixels by distance to `color`, in `bins` equal bins over 0-442. */
export function distanceHistogram(frame: RgbaImage, color: number, bins: number): number[] {
  const counts = new Array<number>(bins).fill(0)
  for (let i = 0; i < frame.data.length; i += 4) {
    const pixel = (frame.data[i] << 16) | (frame.data[i + 1] << 8) | frame.data[i + 2]
    const d = euclideanColorDistance(pixel, color)
    counts[Math.min(bins - 1, Math.floor((d / 442) * bins))]++
  }
  return counts
}

/** Warn when more than this fraction of the frame matches (0.2 = 20%). */
export const TOO_MANY_MATCHING_FRACTION = 0.2
/** Warn when the second group is at least this fraction of the largest. */
export const COMPETING_GROUP_RATIO = 0.5
/** Warn when there are more groups than this. */
export const MANY_GROUPS_COUNT = 50

/** Bounding box of the largest group, and the size of the frame it is in. */
function largestGroupBox(
  analysis: FrameAnalysis,
): { box: GroupBounds; width: number; height: number } | null {
  // analyzeFrame fills in `bounds` (full-size coordinates)...
  if (analysis.bounds && analysis.bounds.length > 0) {
    return {
      box: analysis.bounds[0],
      width: analysis.sourceWidth ?? analysis.width,
      height: analysis.sourceHeight ?? analysis.height,
    }
  }
  // ...but if someone built a FrameAnalysis without it, work it out from `binary`.
  const results = findConnectedGroupsWithBounds(analysis.binary, analysis.width, analysis.height)
  if (results.length === 0) return null
  return { box: results[0].bounds, width: analysis.width, height: analysis.height }
}

/**
 * Quality checks for one frame, in plain language. Returns an empty list when
 * everything looks fine. The limits are the exported constants above.
 */
export function checkFrameQuality(analysis: FrameAnalysis): Warning[] {
  const { groups } = analysis
  if (groups.length === 0) {
    return [{
      code: 'no-match',
      message: 'No pixels are within the threshold in this frame.',
      fix: 'Raise the threshold or sample the object again.',
    }]
  }

  const warnings: Warning[] = []

  // 1. Too much of the frame matches: the threshold is probably too loose.
  const totalPixels = analysis.width * analysis.height
  const matchingFraction = totalPixels > 0 ? analysis.matchingPixels / totalPixels : 0
  if (matchingFraction > TOO_MANY_MATCHING_FRACTION) {
    warnings.push({
      code: 'too-many-matching',
      message: `${Math.round(matchingFraction * 100)}% of the frame matches the color, ` +
        'so the background is probably being picked up too.',
      fix: 'Lower the threshold, or pick a color that stands out more from the background.',
    })
  }

  // 2. The largest group touches the frame edge: part of the object may be
  //    outside the picture, which pulls the centroid away from its real centre.
  const edge = largestGroupBox(analysis)
  if (edge && (
    edge.box.minX <= 0 || edge.box.minY <= 0 ||
    edge.box.maxX >= edge.width - 1 || edge.box.maxY >= edge.height - 1
  )) {
    warnings.push({
      code: 'touches-edge',
      message: 'The largest group touches the edge of the frame, so part of the object ' +
        'may be cut off and its centroid may be off.',
      fix: 'Check that the object is fully in view, or lower the threshold if the ' +
        'background along the edge is matching.',
    })
  }

  // 3. A second group almost as big as the largest: the tracker could jump
  //    between the two from frame to frame.
  if (groups.length > 1 && groups[1].size >= COMPETING_GROUP_RATIO * groups[0].size) {
    const percent = Math.round((groups[1].size / groups[0].size) * 100)
    warnings.push({
      code: 'competing-group',
      message: `A second group is ${percent}% the size of the largest one, so the ` +
        'tracked point may jump between them.',
      fix: 'Lower the threshold or sample a color that only the tracked object has.',
    })
  }

  // 4. Lots of groups: usually noise scattered all over the frame.
  if (groups.length > MANY_GROUPS_COUNT) {
    warnings.push({
      code: 'many-groups',
      message: `There are ${groups.length} separate groups, which usually means ` +
        'noise is matching all over the frame.',
      fix: 'Lower the threshold a little, or sample the object again under the same lighting.',
    })
  }

  return warnings
}

/** A point with x = -1 or y = -1 means nothing matched in that frame. */
function isTracked(point: TrackPoint): boolean {
  return point.x >= 0 && point.y >= 0
}

/**
 * Indexes (in `points`) of frames worth a second look, in increasing order:
 *
 * - a tracked point that jumps further than maxJump px from the previous
 *   tracked point (frames with no match are skipped over)
 * - when `frameSize` is given: a tracked point sitting on the edge of the
 *   frame, which usually means the object is partly out of view
 */
export function findSuspectFrames(
  points: TrackPoint[],
  maxJump: number,
  frameSize?: { width: number; height: number },
): number[] {
  const suspect: number[] = []
  let previous: TrackPoint | null = null

  points.forEach((point, index) => {
    if (!isTracked(point)) return

    const jumped =
      previous !== null && Math.hypot(point.x - previous.x, point.y - previous.y) > maxJump
    const onEdge =
      frameSize !== undefined &&
      (point.x <= 0 || point.y <= 0 ||
        point.x >= frameSize.width - 1 || point.y >= frameSize.height - 1)

    if (jumped || onEdge) suspect.push(index)
    previous = point
  })
  return suspect
}

export type TrackSummary = {
  /** number of rows (frames) */
  frames: number
  /** percentage of frames with a match, 0-100 */
  trackedPct: number
  /** frames with no match (x = y = -1) */
  noMatch: number
  /** total path length between consecutive tracked points */
  distancePx: number
  avgSpeedPxPerSec: number
  /** time from the first row to the last row */
  durationSeconds: number
  /** average time between rows, e.g. 0.04 at 25 fps (0 with fewer than 2 rows) */
  frameIntervalSeconds?: number
  /** most no-match frames in a row */
  longestGapFrames?: number
  /** longestGapFrames * frameIntervalSeconds */
  longestGapSeconds?: number
}

export function summarizeTrack(points: TrackPoint[]): TrackSummary {
  const tracked = points.filter(isTracked)

  let distancePx = 0
  for (let i = 1; i < tracked.length; i++) {
    distancePx += Math.hypot(tracked[i].x - tracked[i - 1].x, tracked[i].y - tracked[i - 1].y)
  }

  // longest run of frames with no match
  let longestGapFrames = 0
  let currentGap = 0
  for (const point of points) {
    currentGap = isTracked(point) ? 0 : currentGap + 1
    longestGapFrames = Math.max(longestGapFrames, currentGap)
  }

  const durationSeconds = points.length ? points[points.length - 1].seconds - points[0].seconds : 0
  const frameIntervalSeconds = points.length > 1 ? durationSeconds / (points.length - 1) : 0

  return {
    frames: points.length,
    trackedPct: points.length ? (tracked.length / points.length) * 100 : 0,
    noMatch: points.length - tracked.length,
    distancePx,
    avgSpeedPxPerSec: durationSeconds > 0 ? distancePx / durationSeconds : 0,
    durationSeconds,
    frameIntervalSeconds,
    longestGapFrames,
    longestGapSeconds: longestGapFrames * frameIntervalSeconds,
  }
}

/** Number(text), but only for real numbers: '' and 'abc' give null. */
function toNumber(text: string): number | null {
  const trimmed = text.trim()
  if (trimmed === '') return null
  const value = Number(trimmed)
  return Number.isFinite(value) ? value : null
}

/**
 * Parses the JAR's CSV: "seconds,x,y" rows, one per frame (about 25 rows per
 * second), e.g. "0.000,1080,581". x = y = -1 means no match in that frame.
 *
 * Forgiving on purpose: the real JAR writes no header, but a "seconds,x,y"
 * header (or any other line that is not three numbers) is skipped, as are
 * blank lines. Windows (CRLF) line endings, spaces around values, a UTF-8
 * byte-order mark and extra columns are all fine.
 */
export function parseTrackCsv(text: string): TrackPoint[] {
  const points: TrackPoint[] = []
  const clean = text.replace(/^\uFEFF/, '') // byte-order mark some editors add

  for (const line of clean.split(/\r\n|\r|\n/)) {
    const parts = line.split(',')
    if (parts.length < 3) continue // blank line or not a data row

    const seconds = toNumber(parts[0])
    const x = toNumber(parts[1])
    const y = toNumber(parts[2])
    if (seconds === null || x === null || y === null) continue // e.g. the header

    points.push({ seconds, x, y })
  }
  return points
}
