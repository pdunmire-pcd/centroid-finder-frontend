import {
  Box,
  Button,
  List,
  ListItem,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { sampleRegion } from '../../centroid/engine'
import { useHiDpiCanvas } from '../../hooks/useHiDpiCanvas'
import { monoFontFamily } from '../../theme'
import type { ColorSample } from '../../types'
import { ColorSwatch } from './ColorSwatch'
import {
  SAMPLE_SIZES,
  clientToPixel,
  formatHex,
  formatRgb,
  formatSeconds,
} from './colorUtils'

export type ColorSamplerProps = {
  /** The frame to sample from. null while it is still loading. */
  frame: ImageData | null
  /** Time of this frame in the video, in seconds (0 for a thumbnail). */
  currentTime: number
  /** Samples taken so far (controlled by the parent). */
  samples: ColorSample[]
  onSamplesChange: (samples: ColorSample[]) => void
}

type Pixel = { x: number; y: number }

/** Two samples belong to the same frame if their times are this close. */
const SAME_FRAME_SECONDS = 0.001

/**
 * Draws a square outline around a sample (or the keyboard cursor).
 * A black line under a white line stays visible on light and dark frames.
 */
function drawSquare(ctx: CanvasRenderingContext2D, pixel: Pixel, size: number, lineWidth: number) {
  // never smaller than a few pixels, or nobody could see it on a big frame
  const side = Math.max(size, lineWidth * 6)
  const left = pixel.x + 0.5 - side / 2
  const top = pixel.y + 0.5 - side / 2

  ctx.lineWidth = lineWidth * 2
  ctx.strokeStyle = '#000000'
  ctx.strokeRect(left, top, side, side)
  ctx.lineWidth = lineWidth
  ctx.strokeStyle = '#ffffff'
  ctx.strokeRect(left, top, side, side)
}

/**
 * Lets the user click on a frame to take color samples.
 *
 * Each sample is the median color of a small square (1x1 to 9x9) around the
 * click, computed by the engine's sampleRegion. The component does not load
 * frames itself: the parent passes in whatever frame is on screen.
 */
export function ColorSampler({ frame, currentTime, samples, onSamplesChange }: ColorSamplerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState<number>(5)
  // Keyboard cursor: only shown while the canvas has focus.
  const [cursor, setCursor] = useState<Pixel | null>(null)

  // Two layers: the frame itself, one canvas pixel per frame pixel (so the
  // colors we show are exactly the colors we sample), and on top a sharp
  // high-DPI canvas with the sample squares and the keyboard cursor.
  const { canvasRef: markersRef, prepare: prepareMarkers } = useHiDpiCanvas(frame?.width ?? 0, frame?.height ?? 0)

  // Draw the frame whenever it changes.
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !frame) return
    canvas.width = frame.width
    canvas.height = frame.height
    ctx.putImageData(frame, 0, 0)
  }, [frame])

  // Redraw the markers whenever something visible changes.
  useEffect(() => {
    const ctx = prepareMarkers() // cleared and scaled, so we draw in frame pixels
    if (!ctx || !frame) return

    // Line width grows with the frame so markers look the same on any size.
    const lineWidth = Math.max(1, Math.round(frame.width / 400))
    samples
      .filter((sample) => Math.abs(sample.seconds - currentTime) < SAME_FRAME_SECONDS)
      .forEach((sample) => drawSquare(ctx, sample, sample.size, lineWidth))

    if (cursor) drawSquare(ctx, cursor, size, lineWidth)
  }, [prepareMarkers, frame, samples, currentTime, cursor, size])

  function addSample(pixel: Pixel) {
    if (!frame) return
    const sample: ColorSample = {
      seconds: currentTime,
      x: pixel.x,
      y: pixel.y,
      size,
      rgb: sampleRegion(frame, pixel.x, pixel.y, size),
    }
    onSamplesChange([...samples, sample])
  }

  function handleClick(event: MouseEvent<HTMLCanvasElement>) {
    if (!frame) return
    const rect = event.currentTarget.getBoundingClientRect()
    const pixel = clientToPixel(
      event.clientX - rect.left,
      event.clientY - rect.top,
      rect.width,
      rect.height,
      frame.width,
      frame.height,
    )
    addSample(pixel)
  }

  // Keyboard support: arrows move the cursor (Shift = 10 px), Enter/Space samples.
  function handleKeyDown(event: KeyboardEvent<HTMLCanvasElement>) {
    if (!frame) return
    const current = cursor ?? { x: Math.floor(frame.width / 2), y: Math.floor(frame.height / 2) }
    const step = event.shiftKey ? 10 : 1

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      addSample(current)
      return
    }

    // how far each arrow key moves the cursor
    const moves: Record<string, Pixel> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    }
    const move = moves[event.key]
    if (!move) return // any other key: let the browser handle it (e.g. Tab)

    event.preventDefault() // stop the arrows from scrolling the page
    setCursor({
      x: Math.min(frame.width - 1, Math.max(0, current.x + move.x)),
      y: Math.min(frame.height - 1, Math.max(0, current.y + move.y)),
    })
  }

  function removeSample(index: number) {
    onSamplesChange(samples.filter((_, i) => i !== index))
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1 }}>
        <Typography id="sample-size-label" variant="body2">
          Sample area
        </Typography>
        <ToggleButtonGroup
          aria-labelledby="sample-size-label"
          size="small"
          exclusive
          value={size}
          onChange={(_, value: number | null) => {
            if (value !== null) setSize(value) // null = clicked the selected one again
          }}
        >
          {SAMPLE_SIZES.map((option) => (
            <ToggleButton key={option} value={option} aria-label={`${option}×${option} pixels`}>
              {option}×{option}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {frame ? (
        <Box sx={{ position: 'relative', lineHeight: 0 }}>
          <canvas
            ref={canvasRef}
            data-testid="sampler-canvas"
            tabIndex={0}
            aria-label="Frame to sample. Click the object to take a color sample. With the keyboard, use the arrow keys to move the square and Enter to sample."
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            onFocus={() =>
              setCursor((old) => old ?? { x: Math.floor(frame.width / 2), y: Math.floor(frame.height / 2) })
            }
            onBlur={() => setCursor(null)}
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              cursor: 'crosshair',
              borderRadius: 10,
              imageRendering: 'pixelated', // show real frame pixels: you sample pixels, not a blur
            }}
          />
          <canvas
            ref={markersRef}
            data-testid="sampler-markers"
            aria-hidden="true"
            // clicks go through to the frame canvas underneath
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          />
        </Box>
      ) : (
        <Box sx={{ aspectRatio: '16 / 9', display: 'grid', placeItems: 'center', bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography color="text.secondary">Waiting for a frame…</Typography>
        </Box>
      )}

      <Typography variant="subtitle2" component="h4" sx={{ mt: 2 }}>
        Samples ({samples.length})
      </Typography>
      {samples.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Click on the animal a few times, ideally on different frames, to collect its colors.
        </Typography>
      ) : (
        <List dense data-testid="sample-list">
          {samples.map((sample, index) => (
            <ListItem
              key={`${sample.seconds}-${sample.x}-${sample.y}-${index}`}
              disableGutters
              sx={{ pr: 10 }} // leave room for the Remove button
              secondaryAction={
                <Button size="small" onClick={() => removeSample(index)} aria-label={`Remove sample ${index + 1}`}>
                  Remove
                </Button>
              }
            >
              <ColorSwatch color={formatHex(sample.rgb)} />
              <Typography variant="body2" data-testid="sample-row" sx={{ fontFamily: monoFontFamily, ml: 1.5, overflowWrap: 'anywhere' }}>
                {formatHex(sample.rgb)} · {formatRgb(sample.rgb)} · {formatSeconds(sample.seconds)} · ({sample.x},{' '}
                {sample.y}) · {sample.size}×{sample.size}
              </Typography>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  )
}
