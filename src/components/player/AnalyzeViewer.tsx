import { Box, Button, Chip, Paper, Stack, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material'
import { useRef, useState } from 'react'
import type { FrameAnalysis } from '../../centroid/engine'
import { useCentroidFrame } from '../../hooks/useCentroidFrame'
import { useVideoFrames } from '../../hooks/useVideoFrames'
import type { TrackPoint } from '../../types'
import { TrajectoryCanvas } from '../shared/TrajectoryCanvas'
import { CrosshairOverlay } from './CrosshairOverlay'
import { addTrackPoint, toTrackPoint } from './trackPoints'
import { describeFrameRates, useFrameRates } from './useFrameRates'
import { seekTo } from './videoControls'
import { VideoPlayer } from './VideoPlayer'

/** side by side = original with overlay | binarized */
export type ViewMode = 'side-by-side' | 'original' | 'binarized'

export type AnalyzeViewerProps = {
  /** URL of the video, or a File from the user's computer */
  src: string | File
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
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side')

  const frame = useVideoFrames(video)

  // Counts analysed frames; a ref because changing it shouldn't re-render.
  const analysedCount = useRef(0)
  const frameRates = describeFrameRates(useFrameRates(video, analysedCount))

  // Called after each frame is analysed. We only record while playing, and
  // only when the analysis is for the frame we know the time of.
  const recordPoint = (analysis: FrameAnalysis, image: ImageData) => {
    analysedCount.current += 1 // for the "analysing N of M fps" readout
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

  // One canvas element for the black-and-white image. Where it goes depends
  // on the view mode; when it moves, useCentroidFrame draws on the new one.
  const binarizedCanvas = (
    <canvas
      ref={canvasRef}
      data-testid="binarized-canvas"
      aria-label="Binarized video frame"
      style={
        viewMode === 'binarized'
          ? { position: 'absolute', inset: 0, width: '100%', height: '100%' } // covers the video
          : { display: 'block', width: '100%', height: 'auto', borderRadius: 4, background: '#000' }
      }
    />
  )

  const overlays = frame && (
    <>
      {viewMode === 'binarized' && binarizedCanvas}
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

  const sideBySide = viewMode === 'side-by-side'

  return (
    <Stack spacing={2}>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={viewMode}
        onChange={(_, value: ViewMode | null) => {
          if (value !== null) setViewMode(value)
        }}
        aria-label="View mode"
      >
        <ToggleButton value="side-by-side">Side by side</ToggleButton>
        <ToggleButton value="original">Original</ToggleButton>
        <ToggleButton value="binarized">Binarized</ToggleButton>
      </ToggleButtonGroup>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          // minmax(0, 1fr) lets a column shrink below the video's natural width
          gridTemplateColumns: { xs: '1fr', md: sideBySide ? 'minmax(0, 1fr) minmax(0, 1fr)' : 'minmax(0, 1fr)' },
        }}
      >
        {/* The player is always the first child, so React keeps the same
            <video> when the mode changes and playback is not interrupted. */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {viewMode === 'binarized' ? 'Binarized' : 'Original'}
          </Typography>
          <VideoPlayer src={src} onVideoElement={setVideo}>
            {overlays}
          </VideoPlayer>
        </Paper>
        {sideBySide && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Binarized
            </Typography>
            {binarizedCanvas}
          </Paper>
        )}
      </Box>

      <Stack direction="row" spacing={2} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary" data-testid="centroid-info">
          {!frame
            ? 'Loading video…'
            : current && largest
              ? `Centroid at (${current.x}, ${current.y}), about ${Math.round(largest.size / (frame.scale * frame.scale))} px`
              : 'No matching pixels in this frame'}
        </Typography>
        {frameRates && (
          <Tooltip title="The computer can't analyse every frame, so some are skipped. The trail has fewer points, but the server's CSV will still have every frame.">
            <Chip size="small" color="warning" variant="outlined" label={frameRates} data-testid="frame-rates" />
          </Tooltip>
        )}
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
