import { useEffect, useEffectEvent, useState } from 'react'
import { parseHexColor, type Group } from '../centroid'
import { analyzeFrame, ignoreTopMargin, type FrameAnalysis } from '../centroid/engine'
import { binaryToRgba } from '../components/player/drawing'

/** What the hook gives back to the component. */
export type CentroidFrameResult = {
  /** Put this on the <canvas> that should show the black-and-white image. */
  canvasRef: (canvas: HTMLCanvasElement | null) => void
  /** Latest analysis, or null before the first frame is done. */
  analysis: FrameAnalysis | null
  /** The biggest group (the tracked object), or null if nothing matched. */
  largest: Group | null
}

/**
 * Shared "binarize + find groups + draw" logic for one frame.
 * Used by the still-image preview and by every frame of the video player.
 *
 * @param image the frame's pixels (null while it is still loading)
 * @param targetColor hex color, e.g. "#ff0000"
 * @param threshold color distance, 0-442
 * @param onAnalysed optional: called after each frame is analysed
 * @param topMargin optional: ignore groups whose centroid is in this many top rows (like the JAR)
 */
export function useCentroidFrame(
  image: ImageData | null,
  targetColor: string,
  threshold: number,
  onAnalysed?: (analysis: FrameAnalysis, image: ImageData) => void,
  topMargin = 0,
): CentroidFrameResult {
  // We keep the canvas in state (not a ref) so that when a new canvas appears,
  // for example after switching view mode, the effect below draws on it again.
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const [analysis, setAnalysis] = useState<FrameAnalysis | null>(null)

  // useEffectEvent lets the effect call the latest onAnalysed prop without
  // re-running the effect every time the parent passes a new function.
  const reportAnalysis = useEffectEvent((result: FrameAnalysis, frame: ImageData) => {
    onAnalysed?.(result, frame)
  })

  // Re-analyse whenever the frame, color, threshold or canvas changes.
  // requestAnimationFrame + cancel means fast slider drags (or fast video
  // frames) only compute the latest value instead of queueing up every one.
  useEffect(() => {
    if (!image) return

    let color: number
    try {
      color = parseHexColor(targetColor)
    } catch {
      return // ignore invalid colors and keep the last good result
    }

    const handle = requestAnimationFrame(() => {
      // analyzeFrame uses workstream A's fast typed-array path (about 15 ms
      // for a full 1080p frame, and the video frames here are only 640 px wide).
      const result = ignoreTopMargin(analyzeFrame(image, color, threshold), topMargin)

      if (canvas) drawAnalysis(canvas, result)
      setAnalysis(result)
      reportAnalysis(result, image)
    })

    return () => cancelAnimationFrame(handle)
  }, [image, targetColor, threshold, canvas, topMargin])

  return {
    canvasRef: setCanvas,
    analysis,
    largest: analysis?.groups[0] ?? null,
  }
}

/**
 * Draws the black-and-white image, one canvas pixel per analysed pixel.
 * The red dot on the biggest group is drawn separately by CentroidDotOverlay,
 * on a sharp high-DPI canvas on top (a dot drawn here would be as blurry as
 * the frame's own pixels when the canvas is stretched).
 */
function drawAnalysis(canvas: HTMLCanvasElement, analysis: FrameAnalysis) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = analysis.width
  canvas.height = analysis.height
  const pixels = binaryToRgba(analysis.binary)
  ctx.putImageData(new ImageData(pixels, analysis.width, analysis.height), 0, 0)
}
