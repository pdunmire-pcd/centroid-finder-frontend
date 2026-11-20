import { useEffect } from 'react'
import type { Coordinate } from '../../centroid'
import { useHiDpiCanvas } from '../../hooks/useHiDpiCanvas'
import { drawCentroidDot } from './drawing'

export type CentroidDotOverlayProps = {
  /** size of the analysed frame in pixels (the binarized canvas's size) */
  width: number
  height: number
  /** the biggest group's centroid, in the same frame pixels; null = no dot */
  point: Coordinate | null
}

/**
 * The red centroid dot on top of the black-and-white image. It is its own
 * transparent canvas, drawn at the screen's devicePixelRatio, so the dot is a
 * crisp circle even when the binarized frame below is shown bigger than its
 * pixel size. Put it in a position: relative box together with that canvas.
 */
export function CentroidDotOverlay({ width, height, point }: CentroidDotOverlayProps) {
  const { canvasRef, prepare } = useHiDpiCanvas(width, height)

  useEffect(() => {
    const ctx = prepare()
    if (ctx && point) drawCentroidDot(ctx, point, width)
  }, [prepare, point, width])

  return (
    <canvas
      ref={canvasRef}
      data-testid="centroid-dot-canvas"
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  )
}
