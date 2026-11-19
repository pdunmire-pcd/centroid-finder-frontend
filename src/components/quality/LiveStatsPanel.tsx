import { Box, Typography } from '@mui/material'
import type { FrameAnalysis } from '../../centroid/engine'
import { computeLiveStats } from './qualityUtils'

export type LiveStatsPanelProps = {
  /** result of analyzeFrame for the frame on screen; null while loading */
  analysis: FrameAnalysis | null
}

/** One label + value pair. */
function Stat({ label, value, testId }: { label: string; value: string; testId: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" component="div">
        {label}
      </Typography>
      <Typography variant="body1" data-testid={testId}>
        {value}
      </Typography>
    </Box>
  )
}

/** Numbers about the current frame that show whether tracking will work. */
export function LiveStatsPanel({ analysis }: LiveStatsPanelProps) {
  if (!analysis) {
    return (
      <Typography variant="body2" color="text.secondary">
        Waiting for a frame…
      </Typography>
    )
  }

  const stats = computeLiveStats(analysis)

  return (
    <Box
      data-testid="live-stats"
      sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' } }}
    >
      <Stat label="Matching pixels" value={`${stats.matchingPercent.toFixed(2)}%`} testId="stat-matching" />
      <Stat label="Groups found" value={String(stats.groupCount)} testId="stat-groups" />
      <Stat
        label="Largest group centroid"
        value={stats.largest ? `(${stats.largest.centroid.x}, ${stats.largest.centroid.y}), ${stats.largest.size} px` : 'none'}
        testId="stat-centroid"
      />
      <Stat
        label="2nd largest / largest"
        value={stats.secondToLargestRatio === null ? '–' : `${Math.round(stats.secondToLargestRatio * 100)}%`}
        testId="stat-ratio"
      />
    </Box>
  )
}
