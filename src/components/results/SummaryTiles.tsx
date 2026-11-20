import { Box, Paper, Typography } from '@mui/material'
import type { TrackSummary } from '../../centroid/engine'
import { summaryTiles } from './summary'

// A grid of small number cards from summarizeTrack().
export function SummaryTiles({ summary }: { summary: TrackSummary }) {
  return (
    <Box
      component="dl" // a description list: each tile is a term (label) + value
      data-cy="summary-tiles"
      sx={{
        m: 0,
        display: 'grid',
        gap: 1.5,
        gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(2, minmax(0, 1fr))' },
      }}
    >
      {summaryTiles(summary).map((tile) => (
        <Paper key={tile.label} sx={{ p: { xs: 1.5, sm: 2 } }} data-cy="summary-tile">
          <Typography component="dt" variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
            {tile.label}
          </Typography>
          <Box component="dd" sx={{ m: 0 }}>
            <Typography component="span" sx={{ fontSize: 24, fontWeight: 600, lineHeight: 1.3 }} data-cy="summary-value">
              {tile.value}
            </Typography>
            {tile.unit && (
              <Typography component="span" color="text.secondary" sx={{ fontSize: 14, ml: 0.5 }}>
                {tile.unit}
              </Typography>
            )}
            <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
              {tile.hint}
            </Typography>
          </Box>
        </Paper>
      ))}
    </Box>
  )
}
