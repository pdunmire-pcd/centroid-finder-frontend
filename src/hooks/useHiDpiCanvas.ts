import { useCallback, useEffect, useState } from 'react'
import { backingStoreSize, fitCanvas } from '../components/shared/hiDpi'

/** window.devicePixelRatio, or 1 where there is no window (tests). */
function currentDpr(): number {
  return typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
}

/**
 * Keeps an overlay canvas sharp on any screen (see src/components/shared/hiDpi.ts).
 *
 * Usage:
 *   const { canvasRef, prepare } = useHiDpiCanvas(videoWidth, videoHeight)
 *   useEffect(() => {
 *     const ctx = prepare()          // sized, cleared and scaled to video pixels
 *     if (!ctx) return
 *     ctx.arc(point.x, point.y, ...) // draw in video pixels as before
 *   }, [prepare, point])
 *
 * `prepare` is a new function whenever the canvas is resized or moves to a
 * screen with another devicePixelRatio, so the effect above redraws then too.
 *
 * @param width logical width: the size of the thing drawn over, in its own pixels
 * @param height logical height
 */
export function useHiDpiCanvas(width: number, height: number) {
  // The canvas is kept in state (a callback ref), so we notice when it appears.
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  // The canvas's size on the page, in CSS pixels; 0 x 0 until measured.
  const [cssSize, setCssSize] = useState({ width: 0, height: 0 })
  const [dpr, setDpr] = useState(currentDpr)

  // Measure the canvas whenever its size on the page changes.
  useEffect(() => {
    if (!canvas || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.contentRect
      setCssSize((old) =>
        old.width === box.width && old.height === box.height ? old : { width: box.width, height: box.height },
      )
    })
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [canvas])

  // Browser zoom or dragging the window to another monitor changes the DPR.
  // Zooming also fires "resize", which is the simplest event to listen to.
  useEffect(() => {
    const update = () => setDpr(currentDpr())
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const prepare = useCallback((): CanvasRenderingContext2D | null => {
    if (!canvas || width <= 0 || height <= 0) return null

    // Not laid out yet (or hidden): fall back to one canvas pixel per video pixel.
    const backing =
      cssSize.width > 0 && cssSize.height > 0
        ? backingStoreSize(cssSize.width, cssSize.height, dpr)
        : { width, height }

    return fitCanvas(canvas, backing, { width, height })
  }, [canvas, cssSize, dpr, width, height])

  return { canvasRef: setCanvas, prepare }
}
