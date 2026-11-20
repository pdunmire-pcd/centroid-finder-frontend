import { useEffect } from 'react'
import type { Coordinate } from '../../centroid'
import { useHiDpiCanvas } from '../../hooks/useHiDpiCanvas'
import { drawCrosshair } from './drawing'

export type CrosshairOverlayProps = {
  /** size of the video in pixels */
  width: number
  height: number
  /** where to draw, in video pixels; null = draw nothing */
  point: Coordinate | null
  /**
   * Crosshair color. AnalyzeViewer passes contrastingMarkerColor(targetColor),
   * so the mark never blends into the animal it sits on (e.g. cyan on a dark
   * red salamander). The dark outline drawn under it keeps it visible on light
   * floors too.
   */
  color?: string
}

/**
 * A transparent canvas over the video with a crosshair on the current centroid.
 * Drawn at the screen's devicePixelRatio, so it is sharp on Retina screens.
 */
export function CrosshairOverlay({ width, height, point, color }: CrosshairOverlayProps) {
  const { canvasRef, prepare } = useHiDpiCanvas(width, height)

  useEffect(() => {
    const ctx = prepare() // sized, cleared, and scaled so we can draw in video pixels
    if (ctx && point) drawCrosshair(ctx, point, color, width)
  }, [prepare, point, color, width])

  return (
    <canvas
      ref={canvasRef}
      data-testid="crosshair-canvas"
      aria-hidden="true" // the centroid is also written out as text under the video
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  )
}
