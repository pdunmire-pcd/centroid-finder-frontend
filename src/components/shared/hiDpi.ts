// Sharp canvas drawing on high-DPI ("Retina") screens.
//
// A <canvas> has two sizes:
//   - its CSS size: how big it looks on the page (e.g. 640 x 360 CSS px)
//   - its backing store (canvas.width/height): how many real pixels it draws
//
// On a Retina screen one CSS pixel is 2 (or 3) device pixels
// (window.devicePixelRatio). If the backing store is smaller than
// CSS size x devicePixelRatio, the browser stretches it and thin lines and
// dots look blurry. So we make the backing store CSS size x DPR, and then
// scale the drawing so the code can keep drawing in *video pixels*:
//
//   ctx.setTransform(canvas.width / videoWidth, 0, 0, canvas.height / videoHeight, 0, 0)
//
// After that, ctx.arc(centroid.x, centroid.y, ...) still lands on the right
// spot, whatever the screen. Clicks are mapped the other way, from CSS
// pixels to video pixels, with getBoundingClientRect() (see screenToLogical),
// which doesn't depend on the backing store at all.
//
// These functions are pure, so they are unit-tested in tests/player/hiDpi.test.ts.

/** Largest backing-store side we allow, to keep memory use sensible (a 4096 x 2304 RGBA canvas is ~38 MB). */
export const MAX_BACKING_SIDE = 4096

export type Size = { width: number; height: number }

/**
 * How many real pixels a canvas shown at cssWidth x cssHeight needs.
 * dpr below 1 (zoomed out) is treated as 1. If the result would be bigger
 * than maxSide, both sides shrink by the same factor, so the shape stays.
 */
export function backingStoreSize(
  cssWidth: number,
  cssHeight: number,
  dpr: number,
  maxSide = MAX_BACKING_SIDE,
): Size {
  const ratio = Math.max(1, dpr || 1)
  let width = cssWidth * ratio
  let height = cssHeight * ratio
  const biggest = Math.max(width, height)
  if (biggest > maxSide) {
    width = (width * maxSide) / biggest
    height = (height * maxSide) / biggest
  }
  return { width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(height)) }
}

/**
 * The scale for ctx.setTransform: backing-store pixels per logical (video) pixel.
 * Drawing at logical (x, y) then lands on backing pixel (x * scaleX, y * scaleY).
 */
export function drawingScale(backing: Size, logical: Size): { scaleX: number; scaleY: number } {
  return {
    scaleX: backing.width / logical.width,
    scaleY: backing.height / logical.height,
  }
}

/**
 * Turns a point on screen (CSS pixels from the canvas's top-left corner, e.g.
 * event.clientX - rect.left) into logical (video) pixels. The backing store
 * and devicePixelRatio don't matter here: only the shown size and the video size do.
 */
export function screenToLogical(
  offsetX: number,
  offsetY: number,
  shown: Size,
  logical: Size,
): { x: number; y: number } {
  return {
    x: (offsetX * logical.width) / shown.width,
    y: (offsetY * logical.height) / shown.height,
  }
}

/**
 * Gives a canvas its backing-store size and a transform, then clears it, so
 * the caller can draw in logical (video) pixels. Returns the 2D context, or
 * null if the browser has no canvas support.
 */
export function fitCanvas(canvas: HTMLCanvasElement, backing: Size, logical: Size): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  // Setting width/height clears the canvas and resets the transform, so only
  // do it when the size really changes.
  if (canvas.width !== backing.width) canvas.width = backing.width
  if (canvas.height !== backing.height) canvas.height = backing.height

  const { scaleX, scaleY } = drawingScale(backing, logical)
  ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0)
  ctx.clearRect(0, 0, logical.width, logical.height) // in logical pixels, thanks to the transform
  return ctx
}
