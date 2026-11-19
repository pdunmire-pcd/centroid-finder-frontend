import type { TrackSummary } from '../../centroid/engine'

// Turns summarizeTrack() numbers into labelled, formatted tiles.

export type Tile = { label: string; value: string; unit?: string; hint: string }

// 1234.5 -> "1,235"; digits = how many decimals to keep
function num(value: number, digits = 0): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

/** The six numbers shown in the tiles. Exported so it can be tested on its own. */
export function summaryTiles(summary: TrackSummary): Tile[] {
  return [
    { label: 'Frames', value: num(summary.frames), hint: 'Rows in the CSV, one per video frame' },
    { label: 'Tracked', value: num(summary.trackedPct, 1), unit: '%', hint: 'Frames where the color was found' },
    { label: 'No-match frames', value: num(summary.noMatch), hint: 'Rows with -1, -1 (nothing found)' },
    { label: 'Duration', value: num(summary.durationSeconds, 2), unit: 's', hint: 'From the first to the last row' },
    { label: 'Distance travelled', value: num(summary.distancePx), unit: 'px', hint: 'Sum of the steps between tracked frames' },
    { label: 'Average speed', value: num(summary.avgSpeedPxPerSec, 1), unit: 'px/s', hint: 'Distance ÷ duration' },
  ]
}
