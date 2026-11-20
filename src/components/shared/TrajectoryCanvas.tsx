import { useEffect, type MouseEvent } from 'react'
import { useHiDpiCanvas } from '../../hooks/useHiDpiCanvas'
import type { TrackPoint } from '../../types'
import { screenToLogical } from './hiDpi'
import { findNearestPoint, isNoMatch, MAX_GAP_SECONDS, trailOpacity } from '../player/trackPoints'

// Shared overlay: draws a trajectory and the current centroid on a transparent
// canvas laid over a <video>. Used by the Analyze page (workstream B, which
// owns improving it) and the Job results page (workstream E).
//
// - Older parts of the trail are fainter.
// - The line breaks at no-match points (-1, -1) and at big jumps in time.
// - With `onPointClick`, clicking near a point reports it (e.g. to seek there).
//   Without it the canvas lets clicks pass through to whatever is underneath.
// - It is drawn at the screen's devicePixelRatio (useHiDpiCanvas), so lines
//   stay sharp on Retina screens, while all the maths stays in video pixels.

export type TrajectoryCanvasProps = {
  /** size of the video in pixels, so coordinates line up */
  width: number
  height: number
  /** sorted by time */
  points: TrackPoint[]
  /** only points up to this time are drawn */
  currentTime: number
  /** how many seconds of trail to keep; undefined = whole path */
  trailSeconds?: number
  color?: string
  onPointClick?: (point: TrackPoint) => void
}

/** How close (in screen pixels) a click must be to a point to count. */
const CLICK_RADIUS_PX = 15

export function TrajectoryCanvas({
  width,
  height,
  points,
  currentTime,
  trailSeconds,
  color = '#00e5ff',
  onPointClick,
}: TrajectoryCanvasProps) {
  const { canvasRef, prepare } = useHiDpiCanvas(width, height)

  const from = trailSeconds === undefined ? -Infinity : currentTime - trailSeconds

  useEffect(() => {
    // Sized, cleared and scaled: from here on we draw in video pixels.
    const ctx = prepare()
    if (!ctx) return

    const visible = points.filter((p) => p.seconds >= from && p.seconds <= currentTime)
    if (visible.length === 0) return

    // With no trail length, the whole visible path fades from oldest to newest.
    const trailLength = trailSeconds ?? currentTime - visible[0].seconds

    ctx.strokeStyle = color
    ctx.lineWidth = Math.max(2, width / 400)
    ctx.lineCap = 'round'

    // Draw each piece of line on its own so each can have its own opacity.
    for (let i = 1; i < visible.length; i++) {
      const start = visible[i - 1]
      const end = visible[i]
      if (isNoMatch(start) || isNoMatch(end)) continue // gap where nothing matched
      if (end.seconds - start.seconds > MAX_GAP_SECONDS) continue // jump in time

      ctx.globalAlpha = trailOpacity(currentTime - end.seconds, trailLength)
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    // A dot on the newest tracked point.
    const last = [...visible].reverse().find((p) => !isNoMatch(p))
    if (last) {
      ctx.beginPath()
      ctx.arc(last.x, last.y, Math.max(4, width / 120), 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
    }
  }, [prepare, width, points, currentTime, from, trailSeconds, color])

  const handleClick = (event: MouseEvent<HTMLCanvasElement>) => {
    if (!onPointClick) return
    // The canvas is stretched to fit the page, so turn the click position
    // (screen pixels) into video pixels first.
    // (This uses the size on screen, not canvas.width, so it doesn't matter
    // how many device pixels the canvas has.)
    const rect = event.currentTarget.getBoundingClientRect()
    const { x, y } = screenToLogical(event.clientX - rect.left, event.clientY - rect.top, rect, { width, height })
    const pixelsPerScreenPixel = width / rect.width

    const visible = points.filter((p) => p.seconds >= from && p.seconds <= currentTime)
    const point = findNearestPoint(visible, x, y, CLICK_RADIUS_PX * pixelsPerScreenPixel)
    if (point) onPointClick(point)
  }

  return (
    <canvas
      ref={canvasRef}
      data-testid="trajectory-canvas"
      // decorative for screen readers: the same path is in the table / the text readout
      aria-hidden="true"
      onClick={handleClick}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        // only catch clicks when someone wants them
        pointerEvents: onPointClick ? 'auto' : 'none',
        cursor: onPointClick ? 'pointer' : 'default',
      }}
    />
  )
}
