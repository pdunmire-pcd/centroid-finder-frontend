import { useEffect, useState } from 'react'
import { pickReadSize } from '../components/player/videoMath'
import { watchVideoFrames } from '../components/player/watchVideoFrames'

/** One video frame, read into pixels we can analyse. */
export type CapturedFrame = {
  /** RGBA pixels, possibly smaller than the video (see `scale`) */
  image: ImageData
  /** time of this frame in the video, in seconds */
  time: number
  /** image width / video width, e.g. 1/3 for 1920 px read at 640 px */
  scale: number
  /** full size of the video in pixels */
  videoWidth: number
  videoHeight: number
}

/**
 * Reads the video's current frame into an ImageData every time a new frame
 * shows: while playing, and also after seeking or stepping while paused.
 *
 * Videos wider than `maxWidth` are read at a smaller size so the analysis can
 * keep up; multiply coordinates by 1 / scale to get back to video pixels.
 */
export function useVideoFrames(video: HTMLVideoElement | null, maxWidth = 640): CapturedFrame | null {
  const [frame, setFrame] = useState<CapturedFrame | null>(null)

  useEffect(() => {
    if (!video) return

    // One offscreen canvas (never added to the page) that we reuse for every frame.
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    let stopped = false
    let busy = false
    // If a new frame arrives while we're still reading one, we remember only
    // its time and read it afterwards. Frames in between are skipped.
    let waitingTime: number | null = null

    const capture = async (time: number) => {
      if (busy) {
        waitingTime = time
        return
      }
      if (video.videoWidth === 0) return // no picture yet

      busy = true
      try {
        const videoWidth = video.videoWidth
        const videoHeight = video.videoHeight
        const size = pickReadSize(videoWidth, videoHeight, maxWidth)

        // Same idea as BinarizedPreview: colorSpaceConversion 'none' stops the
        // browser from applying color profiles, so we get the plain RGB values.
        // createImageBitmap can also shrink the frame for us.
        const bitmap = await createImageBitmap(video, {
          colorSpaceConversion: 'none',
          resizeWidth: size.width,
          resizeHeight: size.height,
          resizeQuality: 'medium',
        })
        if (stopped) {
          bitmap.close()
          return
        }

        canvas.width = size.width
        canvas.height = size.height
        ctx.drawImage(bitmap, 0, 0)
        bitmap.close()

        const image = ctx.getImageData(0, 0, size.width, size.height)
        setFrame({ image, time, scale: size.scale, videoWidth, videoHeight })
      } catch {
        // The video can't give a picture right now (e.g. still loading); the
        // next frame will try again.
      } finally {
        busy = false
      }

      // Read the frame that arrived while we were busy, if any.
      if (waitingTime !== null && !stopped) {
        const next = waitingTime
        waitingTime = null
        capture(next)
      }
    }

    // New frame while playing (and usually after a seek too).
    const stopWatching = watchVideoFrames(video, (mediaTime) => capture(mediaTime))

    // Some browsers don't report a new frame after seeking while paused, so we
    // also read one when a seek finishes, and when the first frame has loaded.
    const onSeeked = () => capture(video.currentTime)
    video.addEventListener('seeked', onSeeked)
    video.addEventListener('loadeddata', onSeeked)
    if (video.readyState >= 2) onSeeked() // first frame already loaded

    return () => {
      stopped = true
      stopWatching()
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('loadeddata', onSeeked)
    }
  }, [video, maxWidth])

  return frame
}
