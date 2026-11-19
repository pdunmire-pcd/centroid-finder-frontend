import { useState } from 'react'
import { Box, Paper, Stack, Typography } from '@mui/material'
import { TrajectoryCanvas } from '../shared/TrajectoryCanvas'
import type { TrackPoint } from '../../types'
import { monoFontFamily } from '../../theme'
import { formatSeconds } from './format'
import { isTracked, pointIndexAt } from './trackData'

type ResultsPlayerProps = {
  videoUrl: string
  filename: string
  points: TrackPoint[]
  currentTime: number
  /** the callback ref from useVideoTime */
  videoRef: (element: HTMLVideoElement | null) => void
}

// The video with the tracked path drawn on top, plus a readout of the
// current frame underneath.
export function ResultsPlayer({ videoUrl, filename, points, currentTime, videoRef }: ResultsPlayerProps) {
  // The video's real pixel size. The CSV uses these pixel coordinates, so the
  // canvas must be the same size for the path to line up. CSS then scales
  // the video and the canvas together.
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)

  const index = pointIndexAt(points, currentTime)
  const point = index >= 0 ? points[index] : null

  return (
    <Paper sx={{ overflow: 'hidden' }}>
      <Box sx={{ position: 'relative', bgcolor: 'common.black', lineHeight: 0 }}>
        <Box
          component="video"
          ref={videoRef}
          src={videoUrl}
          controls
          preload="metadata"
          playsInline
          aria-label={`Video ${filename} with the tracked path drawn on top`}
          data-cy="results-video"
          onLoadedMetadata={(e) => {
            const v = e.currentTarget
            setSize({ width: v.videoWidth, height: v.videoHeight })
          }}
          // width 100% + automatic height keeps the video's shape, so the
          // canvas (stretched over the same box) lines up exactly
          sx={{ width: '100%', height: 'auto', display: 'block' }}
        />
        {/* The canvas ignores the mouse, so the video controls still work */}
        {size && (
          <TrajectoryCanvas width={size.width} height={size.height} points={points} currentTime={currentTime} />
        )}
      </Box>

      {/* aria-live="off": it changes 25 times a second, too often to read aloud */}
      <Stack
        direction="row"
        spacing={3}
        aria-live="off"
        data-cy="current-readout"
        sx={{ px: 2, py: 1, fontFamily: monoFontFamily, fontSize: 13, flexWrap: 'wrap', rowGap: 0.5 }}
      >
        <span>
          <Typography component="span" variant="caption" color="text.secondary">
            TIME{' '}
          </Typography>
          <span data-cy="readout-time">{formatSeconds(currentTime)}</span>
        </span>
        <span>
          <Typography component="span" variant="caption" color="text.secondary">
            FRAME{' '}
          </Typography>
          {index >= 0 ? index + 1 : '–'} / {points.length}
        </span>
        <span>
          <Typography component="span" variant="caption" color="text.secondary">
            X, Y{' '}
          </Typography>
          {point && isTracked(point) ? `${point.x}, ${point.y}` : point ? 'no match' : '–'}
        </span>
      </Stack>
    </Paper>
  )
}
