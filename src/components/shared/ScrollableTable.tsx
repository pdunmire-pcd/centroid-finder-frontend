import type { ReactNode } from 'react'
import { Box, Paper, TableContainer, Typography } from '@mui/material'
import type { Breakpoint } from '@mui/material'

type ScrollableTableProps = {
  /** names the scroll area for screen readers, e.g. "Processing jobs" */
  label: string
  /** below this screen size the table is wider than the screen, so show the hint */
  hintBelow?: Breakpoint
  /** draw the usual card around the table (false when it already sits in one) */
  card?: boolean
  children: ReactNode
}

// A table that scrolls sideways on narrow screens instead of squashing its
// columns or making the whole page scroll. On small screens a hint says so.
// The scroll area can get keyboard focus (tabIndex 0), so keyboard users can
// scroll it with the arrow keys too (axe rule "scrollable-region-focusable").
export function ScrollableTable({ label, hintBelow = 'md', card = true, children }: ScrollableTableProps) {
  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        aria-hidden="true" // a visual hint only; screen readers read the table normally
        sx={{ display: { xs: 'flex', [hintBelow]: 'none' }, alignItems: 'center', gap: 0.75, mb: 1 }}
      >
        Scroll sideways to see every column
        <Box component="span" sx={{ fontSize: 16, lineHeight: 1 }}>
          →
        </Box>
      </Typography>
      <TableContainer
        component={card ? Paper : 'div'}
        tabIndex={0}
        role="region"
        aria-label={label}
        sx={{
          overflowX: 'auto',
          // keeps absolutely positioned things inside (e.g. the visually hidden
          // "Actions" header), so they can't stretch the page sideways
          position: 'relative',
          ...(card ? {} : { border: 1, borderColor: 'divider', borderRadius: 1 }),
        }}
      >
        {children}
      </TableContainer>
    </Box>
  )
}
