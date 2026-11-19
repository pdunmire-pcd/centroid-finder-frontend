// The messages sent to and from the centroid worker, and the code that answers
// one request. This file has no Worker-specific code, so the same function runs
// inside the worker, on the main thread (fallback) and in tests.

import type { RgbaImage } from '../centroid/binarizer'
import { analyzeFrame, type FrameAnalysis } from '../centroid/engine'

/** A frame from a <video>: ImageData from a canvas, or an ImageBitmap. */
export type AnalysisFrame = ImageData | ImageBitmap | RgbaImage

/** What the page asks the worker to do. */
export type AnalysisRequest = {
  /** increasing number, used to match the answer to the question */
  id: number
  frame: AnalysisFrame
  /** 0xRRGGBB */
  color: number
  threshold: number
  /** (0, 1], see analyzeFrame */
  scale: number
}

/** What the worker sends back: the analysis, or an error message. */
export type AnalysisResponse =
  | { id: number; analysis: FrameAnalysis; error?: undefined }
  | { id: number; error: string; analysis?: undefined }

function isImageBitmap(frame: AnalysisFrame): frame is ImageBitmap {
  return typeof ImageBitmap !== 'undefined' && frame instanceof ImageBitmap
}

/**
 * Reads the pixels of an ImageBitmap by drawing it on a canvas.
 * Workers have no `document`, so OffscreenCanvas is used when it exists.
 */
function bitmapToImageData(bitmap: ImageBitmap): ImageData {
  const { width, height } = bitmap
  if (typeof OffscreenCanvas !== 'undefined') {
    const ctx = new OffscreenCanvas(width, height).getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('OffscreenCanvas 2D is not supported')
    ctx.drawImage(bitmap, 0, 0)
    return ctx.getImageData(0, 0, width, height)
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas is not supported')
  ctx.drawImage(bitmap, 0, 0)
  return ctx.getImageData(0, 0, width, height)
}

/** Turns any accepted frame into plain RGBA pixels. Closes ImageBitmaps. */
export function frameToRgba(frame: AnalysisFrame): RgbaImage {
  if (isImageBitmap(frame)) {
    const image = bitmapToImageData(frame)
    frame.close() // free the bitmap's memory straight away
    return image
  }
  return frame
}

/** Answers one request. Never throws: errors come back as `error`. */
export function answerRequest(request: AnalysisRequest): AnalysisResponse {
  try {
    const image = frameToRgba(request.frame)
    const analysis = analyzeFrame(image, request.color, request.threshold, request.scale)
    return { id: request.id, analysis }
  } catch (error) {
    return { id: request.id, error: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * The buffers in a response that can be MOVED to the other thread instead of
 * copied (transferring is instant; copying 2 MB takes time).
 */
export function transferablesOf(response: AnalysisResponse): ArrayBuffer[] {
  const buffer = response.analysis?.binary.buffer
  return buffer instanceof ArrayBuffer ? [buffer] : []
}
