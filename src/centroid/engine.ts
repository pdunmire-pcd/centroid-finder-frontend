// Engine functions shared by the Analyze page, color tools and results pages.
//
// BASELINE VERSION: these work and keep the agreed signatures, but they are
// simple, not fast. Workstream A replaces the insides (typed arrays, worker,
// downscaling) without changing the signatures, so callers never change.

import type { RgbaImage } from './binarizer'
import { toBinaryArray } from './binarizer'
import { euclideanColorDistance } from './colorDistance'
import type { Group } from './group'
import { findConnectedGroups } from './groupFinder'
import type { RgbTriple, TrackPoint, Warning } from '../types'

/** Everything one analysed frame gives back. */
export type FrameAnalysis = {
  /** biggest first, same order as findConnectedGroups */
  groups: Group[]
  /** width * height, 1 = within the threshold */
  binary: Uint8Array
  width: number
  height: number
  matchingPixels: number
}

/**
 * Binarizes a frame and finds its groups.
 * `scale` (0-1] analyses a smaller copy and scales coordinates back up.
 * Baseline: only scale = 1 is implemented.
 */
export function analyzeFrame(
  frame: RgbaImage,
  color: number,
  threshold: number,
  scale = 1,
): FrameAnalysis {
  void scale // TODO(workstream A): downscaling
  const rows = toBinaryArray(frame, color, threshold)
  const groups = findConnectedGroups(rows)
  const binary = new Uint8Array(frame.width * frame.height)
  let matchingPixels = 0
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      if (rows[y][x] === 1) {
        binary[y * frame.width + x] = 1
        matchingPixels++
      }
    }
  }
  return { groups, binary, width: frame.width, height: frame.height, matchingPixels }
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

/** Quality checks for one frame. Baseline: only no-match. TODO(workstream A). */
export function checkFrameQuality(analysis: FrameAnalysis): Warning[] {
  if (analysis.groups.length === 0) {
    return [{
      code: 'no-match',
      message: 'No pixels are within the threshold in this frame.',
      fix: 'Raise the threshold or sample the object again.',
    }]
  }
  return []
}

/** Indexes of points that jump further than maxJump px from the previous tracked point. */
export function findSuspectFrames(points: TrackPoint[], maxJump: number): number[] {
  const suspect: number[] = []
  let prev: TrackPoint | null = null
  points.forEach((p, i) => {
    if (p.x < 0) return
    if (prev && Math.hypot(p.x - prev.x, p.y - prev.y) > maxJump) suspect.push(i)
    prev = p
  })
  return suspect
}

export type TrackSummary = {
  frames: number
  trackedPct: number
  noMatch: number
  distancePx: number
  avgSpeedPxPerSec: number
  durationSeconds: number
}

export function summarizeTrack(points: TrackPoint[]): TrackSummary {
  const tracked = points.filter((p) => p.x >= 0)
  let distancePx = 0
  for (let i = 1; i < tracked.length; i++) {
    distancePx += Math.hypot(tracked[i].x - tracked[i - 1].x, tracked[i].y - tracked[i - 1].y)
  }
  const durationSeconds = points.length ? points[points.length - 1].seconds - points[0].seconds : 0
  return {
    frames: points.length,
    trackedPct: points.length ? (tracked.length / points.length) * 100 : 0,
    noMatch: points.length - tracked.length,
    distancePx,
    avgSpeedPxPerSec: durationSeconds > 0 ? distancePx / durationSeconds : 0,
    durationSeconds,
  }
}

/**
 * Parses the JAR's CSV: "seconds,x,y" rows, one per frame (e.g. 0.040 apart).
 * The header row is optional; the real JAR writes none.
 */
export function parseTrackCsv(text: string): TrackPoint[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !/^seconds/i.test(line))
    .map((line) => {
      const [seconds, x, y] = line.split(',').map(Number)
      return { seconds, x, y }
    })
}
