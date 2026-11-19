import { useEffect, useRef, type MouseEvent } from 'react'
import type { TrackPoint } from '../../types'
import { findNearestPoint, isNoMatch, MAX_GAP_SECONDS, trailOpacity } from '../player/trackPoints'

// Shared overlay: draws a trajectory and the current centroid on a transparent
// canvas laid over a <video>. Used by the Analyze page (workstream B, which
// owns improving it) and the Job results page (workstream E).
//
// - Older parts of the trail are fainter.
// - The line breaks at no-match points (-1, -1) and at big jumps in time.
// - With `onPointClick`, clicking near a point reports it (e.g. to seek there).
//   Without it the canvas lets clicks pass through to whatever is underneath.

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
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const from = trailSeconds === undefined ? -Infinity : currentTime - trailSeconds

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    canvas.width = width
    canvas.height = height
    ctx.clearRect(0, 0, width, height)

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
  }, [width, height, points, currentTime, from, trailSeconds, color])

  const handleClick = (event: MouseEvent<HTMLCanvasElement>) => {
    if (!onPointClick) return
    // The canvas is stretched to fit the page, so turn the click position
    // (screen pixels) into video pixels first.
    const rect = event.currentTarget.getBoundingClientRect()
    const pixelsPerScreenPixel = width / rect.width
    const x = (event.clientX - rect.left) * pixelsPerScreenPixel
    const y = (event.clientY - rect.top) * pixelsPerScreenPixel

    const visible = points.filter((p) => p.seconds >= from && p.seconds <= currentTime)
    const point = findNearestPoint(visible, x, y, CLICK_RADIUS_PX * pixelsPerScreenPixel)
    if (point) onPointClick(point)
  }

  return (
    <canvas
      ref={canvasRef}
      data-testid="trajectory-canvas"
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
