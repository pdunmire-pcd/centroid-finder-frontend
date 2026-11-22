// Pure helpers for the quality panels (unit tested in tests/color/quality.test.ts).

import type { FrameAnalysis } from '../../centroid/engine'
import type { Group } from '../../centroid/group'
import type { Warning } from '../../types'

export type LiveStats = {
  /** share of the frame within the threshold, 0-100 */
  matchingPercent: number
  groupCount: number
  /** the group the tracker follows (null = nothing matched) */
  largest: Group | null
  /**
   * second-largest group size / largest group size, 0-1.
   * Near 0 = one clear winner. Near 1 = two similar groups, so the tracker
   * could jump between them. null when there are fewer than two groups.
   */
  secondToLargestRatio: number | null
}

export function computeLiveStats(analysis: FrameAnalysis): LiveStats {
  const totalPixels = analysis.width * analysis.height
  // groups come biggest first
  const [largest, second] = analysis.groups
  return {
    matchingPercent: totalPixels === 0 ? 0 : (analysis.matchingPixels / totalPixels) * 100,
    groupCount: analysis.groups.length,
    largest: largest ?? null,
    secondToLargestRatio: largest && second ? second.size / largest.size : null,
  }
}

/** How bad a warning is, for the colored MUI Alert. */
export type Severity = 'error' | 'warning'

/**
 * "error" = tracking is certainly wrong (nothing matched, or most of the frame
 * matched). "warning" = tracking may be wrong; check the preview.
 */
export function warningSeverity(code: Warning['code']): Severity {
  if (code === 'no-match' || code === 'too-many-matching') return 'error'
  return 'warning'
}
