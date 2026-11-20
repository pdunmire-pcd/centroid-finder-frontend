import { Box, FormControlLabel, Switch, Typography, useTheme } from '@mui/material'
import { useMemo, useState } from 'react'
import { parseHexColor } from '../../centroid/colorDistance'
import { distanceHistogram } from '../../centroid/engine'
import { MAX_DISTANCE, histogramHeights, percentBelowThreshold } from './colorUtils'

export type DistanceHistogramProps = {
  /** the frame to measure */
  frame: ImageData | null
  /** target color, e.g. "#660005" */
  targetColor: string
  threshold: number
  /** number of bars (default 100, so each bar covers 4.42 distance units) */
  bins?: number
}

// Size of the drawing in SVG units. The SVG scales to the width of its box.
const WIDTH = 400
const HEIGHT = 120
const AXIS = 16 // room for the labels under the bars

/**
 * Bar chart of "how many pixels are how far from the target color".
 * A vertical line marks the threshold: bars left of it are tracked (white).
 */
export function DistanceHistogram({ frame, targetColor, threshold, bins = 100 }: DistanceHistogramProps) {
  const theme = useTheme()
  const [logScale, setLogScale] = useState(true)

  // Counting every pixel is the slow part, so only redo it when the frame or
  // color change (not when the threshold moves).
  const counts = useMemo(() => {
    if (!frame) return null
    try {
      return distanceHistogram(frame, parseHexColor(targetColor), bins)
    } catch {
      return null // invalid color: draw nothing
    }
  }, [frame, targetColor, bins])

  if (!counts) {
    return (
      <Typography variant="body2" color="text.secondary">
        Waiting for a frame…
      </Typography>
    )
  }

  const heights = histogramHeights(counts, logScale)
  const barWidth = WIDTH / bins
  const plotHeight = HEIGHT - AXIS
  const thresholdX = (Math.min(threshold, MAX_DISTANCE) / MAX_DISTANCE) * WIDTH
  const percent = percentBelowThreshold(counts, threshold)

  return (
    <Box>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        role="img"
        aria-label={`Histogram of color distances. About ${percent.toFixed(1)}% of pixels are closer than the threshold ${threshold}.`}
        data-testid="distance-histogram"
        // crisp bar edges at any zoom or screen density (SVG is already resolution-independent)
        shapeRendering="crispEdges"
      >
        {heights.map((height, i) => (
          <rect
            key={i}
            x={i * barWidth}
            y={plotHeight - height * plotHeight}
            width={Math.max(0.5, barWidth - 0.5)}
            height={height * plotHeight}
            // bars that fall under the threshold are the tracked pixels
            fill={(i + 1) * (MAX_DISTANCE / bins) <= threshold ? theme.palette.primary.main : theme.palette.text.secondary}
            fillOpacity={(i + 1) * (MAX_DISTANCE / bins) <= threshold ? 1 : 0.4}
          />
        ))}

        <line
          data-testid="threshold-line"
          data-threshold={threshold}
          x1={thresholdX}
          x2={thresholdX}
          y1={0}
          y2={plotHeight}
          stroke={theme.palette.secondary.main}
          strokeWidth={2}
          strokeDasharray="4 3" // dashed, so the line doesn't rely on color alone
          shapeRendering="geometricPrecision"
        />

        <text x={0} y={HEIGHT - 3} fontSize={10} fill={theme.palette.text.secondary}>
          0 (same color)
        </text>
        <text x={WIDTH} y={HEIGHT - 3} fontSize={10} textAnchor="end" fill={theme.palette.text.secondary}>
          442 (opposite)
        </text>
        <text
          x={Math.min(thresholdX + 3, WIDTH - 60)}
          y={10}
          fontSize={10}
          fill={theme.palette.secondary.main}
        >
          threshold {threshold}
        </text>
      </svg>

      <FormControlLabel
        control={<Switch checked={logScale} onChange={(event) => setLogScale(event.target.checked)} />}
        label="Log scale (shows small bars)"
      />

      <Typography variant="body2" color="text.secondary">
        Each bar counts the pixels at that distance from the target color. The animal should be a bump near 0
        and the background a big bump far to the right. Put the threshold (orange line) in the gap between them.
        About {percent.toFixed(1)}% of the frame is left of the line.
      </Typography>
    </Box>
  )
}
