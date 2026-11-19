import { useEffect, useRef } from 'react'
import type { Coordinate } from '../../centroid'
import { drawCrosshair } from './drawing'

export type CrosshairOverlayProps = {
  /** size of the video in pixels */
  width: number
  height: number
  /** where to draw, in video pixels; null = draw nothing */
  point: Coordinate | null
}

/** A transparent canvas over the video with a crosshair on the current centroid. */
export function CrosshairOverlay({ width, height, point }: CrosshairOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    canvas.width = width
    canvas.height = height
    ctx.clearRect(0, 0, width, height)
    if (point) drawCrosshair(ctx, point)
  }, [width, height, point])

  return (
    <canvas
      ref={canvasRef}
      data-testid="crosshair-canvas"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  )
}
