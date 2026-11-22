import { useEffect, useState, type RefObject } from 'react'

/** Frames per second over the last second. */
export type FrameRates = {
  /** frames the video showed */
  videoFps: number
  /** frames we analysed */
  analysedFps: number
  playing: boolean
}

/**
 * "analysing 12 of 25 fps" while playing and frames are being skipped,
 * otherwise null (nothing to warn about).
 */
export function describeFrameRates(rates: FrameRates | null): string | null {
  if (!rates || !rates.playing || rates.videoFps === 0) return null
  if (rates.analysedFps >= rates.videoFps - 1) return null // keeping up (±1 for timing)
  return `analysing ${rates.analysedFps} of ${rates.videoFps} fps`
}

/** Total frames the browser has decoded for this video so far. */
function videoFrameCount(video: HTMLVideoElement): number {
  if (typeof video.getVideoPlaybackQuality !== 'function') return 0
  return video.getVideoPlaybackQuality().totalVideoFrames
}

/**
 * Once a second, compares how many frames the video showed with how many we
 * analysed (`analysedCount` is a counter the caller adds 1 to per analysis).
 */
export function useFrameRates(
  video: HTMLVideoElement | null,
  analysedCount: RefObject<number>,
): FrameRates | null {
  const [rates, setRates] = useState<FrameRates | null>(null)

  useEffect(() => {
    if (!video) return
    let lastVideoFrames = videoFrameCount(video)
    let lastAnalysed = analysedCount.current

    const timer = window.setInterval(() => {
      const videoFrames = videoFrameCount(video)
      const analysed = analysedCount.current
      setRates({
        videoFps: videoFrames - lastVideoFrames,
        analysedFps: analysed - lastAnalysed,
        playing: !video.paused,
      })
      lastVideoFrames = videoFrames
      lastAnalysed = analysed
    }, 1000)

    return () => window.clearInterval(timer)
  }, [video, analysedCount])

  return rates
}
