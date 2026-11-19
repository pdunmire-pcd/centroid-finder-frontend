import { useCallback, useEffect, useRef, useState } from 'react'

// Keeps React state in sync with a <video>'s currentTime.
//
// The browser's "timeupdate" event only fires about 4 times a second, which
// makes the drawn path jump. So while the video plays we also read the time
// on every animation frame (requestAnimationFrame, ~60 times a second) and
// stop that loop as soon as it pauses.
//
// Usage:
//   const { videoRef, currentTime, seek } = useVideoTime()
//   <video ref={videoRef} ... />
export function useVideoTime() {
  // The element is kept in state (set by the callback ref below), so the
  // effect re-runs when the <video> element appears on the page.
  const [video, setVideo] = useState<HTMLVideoElement | null>(null)
  // The same element in a ref: React state should never be changed in place,
  // but seeking means changing the element, so seek() goes through the ref.
  const elementRef = useRef<HTMLVideoElement | null>(null)
  const videoRef = useCallback((element: HTMLVideoElement | null) => {
    elementRef.current = element
    setVideo(element)
  }, [])
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    if (!video) return
    let frameId = 0

    const readTime = () => setCurrentTime(video.currentTime)
    const loop = () => {
      readTime()
      frameId = requestAnimationFrame(loop)
    }
    const startLoop = () => {
      cancelAnimationFrame(frameId)
      frameId = requestAnimationFrame(loop)
    }
    const stopLoop = () => {
      cancelAnimationFrame(frameId)
      readTime()
    }

    video.addEventListener('play', startLoop)
    video.addEventListener('pause', stopLoop)
    video.addEventListener('ended', stopLoop)
    video.addEventListener('seeked', readTime) // user dragged the video's own slider
    video.addEventListener('timeupdate', readTime)

    return () => {
      cancelAnimationFrame(frameId)
      video.removeEventListener('play', startLoop)
      video.removeEventListener('pause', stopLoop)
      video.removeEventListener('ended', stopLoop)
      video.removeEventListener('seeked', readTime)
      video.removeEventListener('timeupdate', readTime)
    }
  }, [video])

  // Jump the video to a time (from a chart click or a table row click)
  const seek = useCallback((seconds: number) => {
    if (elementRef.current) elementRef.current.currentTime = seconds
    setCurrentTime(seconds) // update right away; "seeked" confirms it later
  }, [])

  return { videoRef, currentTime, seek }
}
