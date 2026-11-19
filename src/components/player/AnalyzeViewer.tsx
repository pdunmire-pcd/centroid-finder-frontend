import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import type { FrameAnalysis } from '../../centroid/engine'
import { useCentroidFrame } from '../../hooks/useCentroidFrame'
import { useVideoFrames } from '../../hooks/useVideoFrames'
import type { TrackPoint } from '../../types'
import { TrajectoryCanvas } from '../shared/TrajectoryCanvas'
import { CrosshairOverlay } from './CrosshairOverlay'
import { addTrackPoint, toTrackPoint } from './trackPoints'
import { seekTo } from './videoControls'
import { VideoPlayer } from './VideoPlayer'

export type AnalyzeViewerProps = {
  /** URL of the video */
  src: string
  /** hex color, e.g. "#ff0000" */
  targetColor: string
  /** 0-442 */
  threshold: number
}

/**
 * The live centroid finder: plays a video, analyses each frame it can, and
 * draws the centroid and the trajectory over the video.
 *
 * Pipeline for every new frame:
 *   <video> -> useVideoFrames (pixels) -> useCentroidFrame (groups + drawing)
 *           -> recordPoint (trajectory) -> overlays
 */
export function AnalyzeViewer({ src, targetColor, threshold }: AnalyzeViewerProps) {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null)
  // Centroids recorded while playing, in video pixels, sorted by time.
  const [points, setPoints] = useState<TrackPoint[]>([])

  const frame = useVideoFrames(video)

  // Called after each frame is analysed. We only record while playing, and
  // only when the analysis is for the frame we know the time of.
  const recordPoint = (analysis: FrameAnalysis, image: ImageData) => {
    if (!video || video.paused || !frame || frame.image !== image) return
    const centroid = analysis.groups[0]?.centroid ?? null
    const point = toTrackPoint(centroid, frame.time, frame.scale)
    setPoints((old) => addTrackPoint(old, point))
  }

  const { canvasRef, largest } = useCentroidFrame(frame?.image ?? null, targetColor, threshold, recordPoint)

  // The current centroid in full video pixels, for the crosshair and the text.
  const current = frame && largest ? toTrackPoint(largest.centroid, frame.time, frame.scale) : null

  const seekToPoint = (point: TrackPoint) => {
    // 1 ms past the frame's start, so the browser surely shows that frame.
    if (video) seekTo(video, point.seconds + 0.001)
  }

  const overlays = frame && (
    <>
      <TrajectoryCanvas
        width={frame.videoWidth}
        height={frame.videoHeight}
        points={points}
        currentTime={frame.time}
        onPointClick={seekToPoint}
      />
      <CrosshairOverlay width={frame.videoWidth} height={frame.videoHeight} point={current} />
    </>
  )

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' } }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Original
          </Typography>
          <VideoPlayer src={src} onVideoElement={setVideo}>
            {overlays}
          </VideoPlayer>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Binarized
          </Typography>
          <canvas
            ref={canvasRef}
            data-testid="binarized-canvas"
            aria-label="Binarized video frame"
            style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 4, background: '#000' }}
          />
        </Paper>
      </Box>

      <Stack direction="row" spacing={2} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary" data-testid="centroid-info">
          {!frame
            ? 'Loading video…'
            : current && largest
              ? `Centroid at (${current.x}, ${current.y}), about ${Math.round(largest.size / (frame.scale * frame.scale))} px`
              : 'No matching pixels in this frame'}
        </Typography>
        <Typography variant="body2" color="text.secondary" data-testid="trail-info">
          Trail: {points.length} points
        </Typography>
        <Button size="small" variant="outlined" onClick={() => setPoints([])} disabled={points.length === 0}>
          Clear trail
        </Button>
      </Stack>
    </Stack>
  )
}
