import { useMemo, useState } from 'react'
import type { KeyboardEvent } from 'react'
import {
  Box,
  Button,
  Chip,
  FormControlLabel,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { TrackPoint } from '../../types'
import { chartSeriesColors, monoFontFamily } from '../../theme'
import { ScrollableTable } from '../shared/ScrollableTable'
import { buildTableRows, pageForFrame } from './trackData'

const ROWS_PER_PAGE = 25

type TrackTableProps = {
  points: TrackPoint[]
  suspectIndexes: number[]
  /** index of the frame the video is showing, -1 before the first one */
  currentIndex: number
  onSeek: (seconds: number) => void
}

// The CSV as a paginated table. Click (or press Enter on) a row to jump the
// video there. Flagged rows are tinted and have a note.
export function TrackTable({ points, suspectIndexes, currentIndex, onSeek }: TrackTableProps) {
  const theme = useTheme()
  const suspectColor = chartSeriesColors[theme.palette.mode].suspect
  const [page, setPage] = useState(0)
  const [flaggedOnly, setFlaggedOnly] = useState(false)

  const allRows = useMemo(() => buildTableRows(points, suspectIndexes), [points, suspectIndexes])
  const rows = flaggedOnly ? allRows.filter((row) => row.note !== null) : allRows
  const flaggedCount = allRows.filter((row) => row.note !== null).length

  // If the list got shorter (filter switched on), don't stay on a page that no longer exists
  const lastPage = Math.max(0, Math.ceil(rows.length / ROWS_PER_PAGE) - 1)
  const shownPage = Math.min(page, lastPage)
  const pageRows = rows.slice(shownPage * ROWS_PER_PAGE, (shownPage + 1) * ROWS_PER_PAGE)

  const onRowKey = (event: KeyboardEvent, seconds: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault() // stop Space from scrolling the page
      onSeek(seconds)
    }
  }

  return (
    <Box data-cy="track-table">
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 1 }}
      >
        <Box>
          <Typography variant="h2">CSV data</Typography>
          <Typography variant="caption" color="text.secondary">
            {points.length.toLocaleString('en-US')} rows · {flaggedCount.toLocaleString('en-US')} flagged · click a
            row to jump the video there
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControlLabel
            control={
              <Switch
                checked={flaggedOnly}
                onChange={(e) => setFlaggedOnly(e.target.checked)}
                slotProps={{ input: { 'aria-label': 'Only show flagged rows' } }}
                data-cy="flagged-only"
              />
            }
            label="Only flagged"
          />
          <Button
            size="small"
            variant="outlined"
            onClick={() => setPage(pageForFrame(rows, currentIndex, ROWS_PER_PAGE))}
            data-cy="jump-to-current"
          >
            Jump to current time
          </Button>
        </Stack>
      </Stack>

      <ScrollableTable label="CSV data table" hintBelow="sm" card={false}>
        <Table size="small" aria-label="Tracked positions, one row per frame" sx={{ minWidth: 440 }}>
          <TableHead>
            <TableRow>
              <TableCell align="right">Frame</TableCell>
              <TableCell align="right">Seconds</TableCell>
              <TableCell align="right">x</TableCell>
              <TableCell align="right">y</TableCell>
              <TableCell>Note</TableCell>
            </TableRow>
          </TableHead>
          <TableBody sx={{ '& td': { fontFamily: monoFontFamily, fontSize: 13 } }}>
            {pageRows.map(({ index, point, note }) => {
              const isCurrent = index === currentIndex
              // Tint flagged rows: grey for no match, magenta for suspect jumps
              const tint =
                note === 'No match'
                  ? theme.palette.action.hover
                  : note === 'Suspect jump'
                    ? alpha(suspectColor, 0.12)
                    : undefined
              return (
                <TableRow
                  key={index}
                  hover
                  selected={isCurrent}
                  tabIndex={0}
                  aria-current={isCurrent ? 'true' : undefined}
                  onClick={() => onSeek(point.seconds)}
                  onKeyDown={(e) => onRowKey(e, point.seconds)}
                  data-cy="track-row"
                  data-frame={index}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: tint,
                    // A bar on the left marks the row the video is showing
                    boxShadow: isCurrent ? `inset 3px 0 0 ${theme.palette.primary.main}` : 'none',
                    '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: -2 },
                  }}
                >
                  <TableCell align="right">{index + 1}</TableCell>
                  <TableCell align="right">{point.seconds.toFixed(3)}</TableCell>
                  <TableCell align="right">{point.x}</TableCell>
                  <TableCell align="right">{point.y}</TableCell>
                  <TableCell sx={{ fontFamily: 'inherit' }}>
                    {note && (
                      <Chip
                        size="small"
                        label={note}
                        variant="outlined"
                        sx={note === 'Suspect jump' ? { borderColor: suspectColor } : undefined}
                      />
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
            {pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                  No flagged rows. Every frame was tracked without big jumps.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollableTable>
      <TablePagination
        component="div"
        count={rows.length}
        page={shownPage}
        onPageChange={(_, next) => setPage(next)}
        rowsPerPage={ROWS_PER_PAGE}
        rowsPerPageOptions={[ROWS_PER_PAGE]}
      />
    </Box>
  )
}
