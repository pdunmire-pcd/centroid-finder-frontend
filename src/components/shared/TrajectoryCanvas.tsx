import { useEffect, useRef } from 'react'
import type { TrackPoint } from '../../types'

// Shared overlay: draws a trajectory and the current centroid on a transparent
// canvas laid over a <video>. Used by the Analyze page (workstream B, which
// owns improving it) and the Job results page (workstream E).
//
// BASELINE VERSION: plain line, breaks at no-match points (-1, -1).

export type TrajectoryCanvasProps = {
  /** size of the video in pixels, so coordinates line up */
  width: number
  height: number
  points: TrackPoint[]
  /** only points up to this time are drawn */
  currentTime: number
  /** how many seconds of trail to keep; undefined = whole path */
  trailSeconds?: number
  color?: string
  onPointClick?: (point: TrackPoint) => void
}

export function TrajectoryCanvas({
  width,
  height,
  points,
  currentTime,
  trailSeconds,
  color = '#00e5ff',
}: TrajectoryCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    canvas.width = width
    canvas.height = height
    ctx.clearRect(0, 0, width, height)

    const from = trailSeconds === undefined ? -Infinity : currentTime - trailSeconds
    const visible = points.filter((p) => p.seconds >= from && p.seconds <= currentTime)

    ctx.strokeStyle = color
    ctx.lineWidth = Math.max(2, width / 400)
    ctx.beginPath()
    let drawing = false
    for (const p of visible) {
      if (p.x < 0) {
        drawing = false // gap where nothing matched
        continue
      }
      if (drawing) ctx.lineTo(p.x, p.y)
      else ctx.moveTo(p.x, p.y)
      drawing = true
    }
    ctx.stroke()

    const last = [...visible].reverse().find((p) => p.x >= 0)
    if (last) {
      ctx.beginPath()
      ctx.arc(last.x, last.y, Math.max(4, width / 120), 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
    }
  }, [width, height, points, currentTime, trailSeconds, color])

  return (
    <canvas
      ref={canvasRef}
      data-testid="trajectory-canvas"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  )
}
