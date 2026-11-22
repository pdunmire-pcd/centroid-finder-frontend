import { memo, useMemo } from 'react'
import type { ReactNode } from 'react'
import { Box, Stack, Typography, useTheme } from '@mui/material'
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TrackPoint } from '../../types'
import { chartSeriesColors } from '../../theme'
import { formatSeconds } from './format'
import { downsampleForChart, noMatchBands } from './trackData'

// Drawing hundreds of suspect lines makes the chart slow and unreadable;
// the table still lists all of them.
const MAX_SUSPECT_MARKS = 300

type PositionChartProps = {
  points: TrackPoint[]
  /** indexes into points, from findSuspectFrames */
  suspectIndexes: number[]
  /** where the video is; the page rounds it so the chart redraws ~10x a second, not 60x */
  currentTime: number
  /** called with a time in seconds when the chart is clicked */
  onSeek: (seconds: number) => void
  height?: number
}

// A small colored sample for the legend
function LegendItem({ label, swatch }: { label: string; swatch: ReactNode }) {
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
      {swatch}
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  )
}

// x and y position against time, with no-match bands, suspect jumps and the
// video's current time. Clicking the chart seeks the video to that time.
// memo(): only redraw when a prop actually changes.
export const PositionChart = memo(function PositionChart({
  points,
  suspectIndexes,
  currentTime,
  onSeek,
  height = 280,
}: PositionChartProps) {
  const theme = useTheme()
  const colors = chartSeriesColors[theme.palette.mode]
  const ink = theme.palette.text.secondary
  const grid = theme.palette.divider

  // These only change when a new CSV arrives
  const rows = useMemo(() => downsampleForChart(points), [points])
  const bands = useMemo(() => noMatchBands(points), [points])
  const suspectTimes = useMemo(
    () => suspectIndexes.slice(0, MAX_SUSPECT_MARKS).map((i) => points[i].seconds),
    [points, suspectIndexes],
  )

  return (
    <Box data-cy="position-chart">
      {/* Our own legend (HTML), so it can include the band and marker styles */}
      <Stack direction="row" sx={{ flexWrap: 'wrap', columnGap: 2.5, rowGap: 0.5, mb: 1 }} aria-hidden="true">
        {/* x is a solid line and y a dashed one, so they differ by more than color */}
        <LegendItem label="x (px), solid" swatch={<Box sx={{ width: 18, height: 0, borderTop: `2.5px solid ${colors.x}` }} />} />
        <LegendItem label="y (px), dashed" swatch={<Box sx={{ width: 18, height: 0, borderTop: `2.5px dashed ${colors.y}` }} />} />
        <LegendItem label="No match" swatch={<Box sx={{ width: 12, height: 12, bgcolor: 'action.selected' }} />} />
        <LegendItem
          label={`Suspect jump (${suspectIndexes.length})`}
          swatch={<Box sx={{ width: 0, height: 12, borderLeft: `2px dashed ${colors.suspect}` }} />}
        />
        <LegendItem label="Video time" swatch={<Box sx={{ width: 0, height: 12, borderLeft: 2, borderColor: 'text.primary' }} />} />
      </Stack>

      {/* The label describes the chart for screen readers; the table below has the data */}
      <Box
        role="group"
        aria-label={`Chart of x and y position over ${formatSeconds(points.at(-1)?.seconds ?? 0)}. Click to jump the video to a time. The CSV data table below has the same numbers and works with the keyboard.`}
        sx={{ cursor: 'crosshair', '& .recharts-surface:focus': { outline: 'none' } }}
      >
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart
            data={rows}
            margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
            onClick={(state) => {
              // The chart tells us which row is under the mouse
              const index = Number(state.activeTooltipIndex)
              if (Number.isInteger(index) && rows[index]) onSeek(rows[index].seconds)
            }}
          >
            <CartesianGrid stroke={grid} vertical={false} />
            <XAxis
              dataKey="seconds"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(s: number) => `${s}s`}
              stroke={ink}
              tick={{ fontSize: 12 }}
            />
            <YAxis stroke={ink} tick={{ fontSize: 12 }} width={48} />

            {bands.map((band) => (
              <ReferenceArea
                key={band.start}
                x1={band.start}
                x2={band.end}
                fill={theme.palette.text.primary}
                fillOpacity={0.1}
                strokeOpacity={0}
                ifOverflow="hidden"
              />
            ))}
            {suspectTimes.map((t) => (
              <ReferenceLine key={t} x={t} stroke={colors.suspect} strokeDasharray="3 3" strokeWidth={1.5} />
            ))}

            {/* connectNulls={false}: a null row (no match) leaves a gap in the line */}
            <Line dataKey="x" name="x" stroke={colors.x} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
            <Line dataKey="y" name="y" stroke={colors.y} strokeWidth={2} strokeDasharray="6 3" dot={false} connectNulls={false} isAnimationActive={false} />

            <ReferenceLine x={currentTime} stroke={theme.palette.text.primary} strokeWidth={1.5} ifOverflow="hidden" />

            <Tooltip
              labelFormatter={(s) => `t = ${formatSeconds(Number(s))}`}
              formatter={(value, name) => [value === null || value === undefined ? 'no match' : `${value} px`, name]}
              contentStyle={{
                background: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 10,
                fontSize: 12,
                color: theme.palette.text.primary,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  )
})
