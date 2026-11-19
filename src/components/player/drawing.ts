// Small drawing helpers shared by the still-image preview and the video player.

import type { Coordinate } from '../../centroid'

/**
 * Turns the engine's flat 0/1 array into RGBA pixels: 1 -> white, 0 -> black.
 * Every pixel is fully opaque. No DOM needed, so it is easy to unit test.
 */
export function binaryToRgba(binary: Uint8Array): Uint8ClampedArray<ArrayBuffer> {
  const pixels = new Uint8ClampedArray(binary.length * 4)
  for (let i = 0; i < binary.length; i++) {
    const value = binary[i] === 1 ? 255 : 0
    pixels[i * 4] = value
    pixels[i * 4 + 1] = value
    pixels[i * 4 + 2] = value
    pixels[i * 4 + 3] = 255
  }
  return pixels
}

/** Draws a red dot with a white outline, sized relative to the canvas. */
export function drawCentroidDot(ctx: CanvasRenderingContext2D, point: Coordinate) {
  const radius = Math.max(4, Math.round(ctx.canvas.width / 120))
  ctx.beginPath()
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
  ctx.fillStyle = '#ff1744'
  ctx.fill()
  ctx.lineWidth = Math.max(1, radius / 3)
  ctx.strokeStyle = '#ffffff'
  ctx.stroke()
}

/** Draws a crosshair (a cross and a ring) centred on a point. */
export function drawCrosshair(ctx: CanvasRenderingContext2D, point: Coordinate, color = '#ff1744') {
  const size = Math.max(12, Math.round(ctx.canvas.width / 40))
  const lineWidth = Math.max(2, Math.round(ctx.canvas.width / 600))

  const tracePath = () => {
    ctx.beginPath()
    ctx.moveTo(point.x - size, point.y)
    ctx.lineTo(point.x + size, point.y)
    ctx.moveTo(point.x, point.y - size)
    ctx.lineTo(point.x, point.y + size)
    ctx.moveTo(point.x + size / 2, point.y)
    ctx.arc(point.x, point.y, size / 2, 0, Math.PI * 2)
  }

  // A wider dark line first and the color on top, so it shows on any background.
  tracePath()
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)'
  ctx.lineWidth = lineWidth + 2
  ctx.stroke()

  tracePath()
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.stroke()
}
