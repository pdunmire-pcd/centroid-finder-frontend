// Builds small test frames in the browser, so we know every pixel's color.

import type { RgbTriple } from '../../../src/types'

/** A width x height frame filled with one color. */
export function solidFrame(width: number, height: number, rgb: RgbTriple): ImageData {
  const frame = new ImageData(width, height)
  for (let i = 0; i < frame.data.length; i += 4) {
    frame.data[i] = rgb[0]
    frame.data[i + 1] = rgb[1]
    frame.data[i + 2] = rgb[2]
    frame.data[i + 3] = 255
  }
  return frame
}

/** Changes one pixel of a frame (in place) and returns the frame. */
export function setPixel(frame: ImageData, x: number, y: number, rgb: RgbTriple): ImageData {
  const i = (y * frame.width + x) * 4
  frame.data[i] = rgb[0]
  frame.data[i + 1] = rgb[1]
  frame.data[i + 2] = rgb[2]
  return frame
}

/** Fills a rectangle of a frame (in place) with one color and returns the frame. */
export function fillRect(
  frame: ImageData,
  left: number,
  top: number,
  width: number,
  height: number,
  rgb: RgbTriple,
): ImageData {
  for (let y = top; y < top + height; y++) {
    for (let x = left; x < left + width; x++) setPixel(frame, x, y, rgb)
  }
  return frame
}
