import { Alert, Box, CircularProgress, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useCentroidFrame } from '../hooks/useCentroidFrame'
import { CentroidDotOverlay } from './player/CentroidDotOverlay'

export type BinarizedPreviewProps = {
  /** URL of the frame to binarize, e.g. `/thumbnail/${filename}` */
  imageSrc: string
  /** Hex color from the color picker, e.g. "#ff0000" */
  targetColor: string
  /** Distance threshold from the slider */
  threshold: number
}

type LoadResult =
  | { src: string; image: ImageData; error?: undefined }
  | { src: string; error: string; image?: undefined }

/**
 * Loads an image and returns its raw pixels.
 *
 * colorSpaceConversion: 'none' stops the browser from applying color profiles,
 * so we get the same RGB values Java's ImageIO reads from the file.
 */
async function loadImageData(src: string, signal: AbortSignal): Promise<ImageData> {
  const response = await fetch(src, { signal })
  if (!response.ok) {
    throw new Error(`Could not load image (status ${response.status})`)
  }
  const bitmap = await createImageBitmap(await response.blob(), {
    colorSpaceConversion: 'none',
  })

  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas is not supported')

  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

export function BinarizedPreview({
  imageSrc,
  targetColor,
  threshold,
}: BinarizedPreviewProps) {
  const [loaded, setLoaded] = useState<LoadResult | null>(null)

  // Results from a previous imageSrc count as "still loading".
  const current = loaded?.src === imageSrc ? loaded : null
  const source = current?.image ?? null
  const loadError = current?.error ?? null

  // 1. Load the frame whenever the image URL changes.
  useEffect(() => {
    const controller = new AbortController()

    loadImageData(imageSrc, controller.signal)
      .then((image) => setLoaded({ src: imageSrc, image }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setLoaded({
          src: imageSrc,
          error: error instanceof Error ? error.message : 'Could not load image',
        })
      })

    return () => controller.abort()
  }, [imageSrc])

  // 2. Re-binarize whenever the image, color or threshold changes.
  //    The shared hook does the work and draws on the canvas we give it.
  const { canvasRef, analysis, largest } = useCentroidFrame(source, targetColor, threshold)

  if (loadError) {
    return <Alert severity="error">{loadError}</Alert>
  }

  return (
    <Box>
      <Box sx={{ position: 'relative', lineHeight: 0 }}>
        {!source && (
          <Box
            sx={{
              aspectRatio: '16 / 9',
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'action.hover',
              borderRadius: 1,
            }}
          >
            <CircularProgress aria-label="Loading preview" />
          </Box>
        )}
        <canvas
          ref={canvasRef}
          data-testid="binarized-canvas"
          role="img"
          aria-label="Binarized preview: white pixels match the tracking color"
          style={{
            display: source ? 'block' : 'none',
            width: '100%',
            height: 'auto',
            borderRadius: 4,
            imageRendering: 'pixelated', // crisp analysed pixels when stretched
          }}
        />
        {/* the red dot on the biggest group, on a sharp high-DPI canvas */}
        {source && analysis && (
          <CentroidDotOverlay width={analysis.width} height={analysis.height} point={largest?.centroid ?? null} />
        )}
      </Box>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 1 }}
        data-testid="centroid-info"
      >
        {!source
          ? 'Loading…'
          : largest
            ? `Largest group: ${largest.size} px at (${largest.centroid.x}, ${largest.centroid.y})`
            : 'No matching pixels at this threshold'}
      </Typography>
    </Box>
  )
}
