import { Box, Typography } from '@mui/material'
import { useEffect, useRef } from 'react'
import { parseHexColor } from '../../centroid/colorDistance'
import { distanceMapPixels } from './colorUtils'

export type DistanceMapProps = {
  frame: ImageData | null
  /** target color, e.g. "#660005" */
  targetColor: string
  threshold: number
}

/**
 * False-color picture of the frame: the closer a pixel is to the target color,
 * the brighter it is. Unlike the black-and-white preview, it also shows pixels
 * that are *almost* inside the threshold.
 */
export function DistanceMap({ frame, targetColor, threshold }: DistanceMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!frame) return
    let color: number
    try {
      color = parseHexColor(targetColor)
    } catch {
      return // invalid color: keep the last picture
    }

    // Wait for the next animation frame so fast slider drags only draw the latest value.
    const request = requestAnimationFrame(() => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) return

      canvas.width = frame.width
      canvas.height = frame.height
      const image = new ImageData(frame.width, frame.height)
      image.data.set(distanceMapPixels(frame, color, threshold))
      ctx.putImageData(image, 0, 0)
    })
    return () => cancelAnimationFrame(request)
  }, [frame, targetColor, threshold])

  if (!frame) {
    return (
      <Typography variant="body2" color="text.secondary">
        Waiting for a frame…
      </Typography>
    )
  }

  return (
    <Box>
      <canvas
        ref={canvasRef}
        data-testid="distance-map"
        role="img"
        aria-label="Distance map: brighter pixels are closer to the target color"
        style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 4 }}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        White = exactly the target color. Orange = right at the threshold. Black = twice the threshold or
        further. Bright spots away from the animal are what may confuse the tracker.
      </Typography>
    </Box>
  )
}
