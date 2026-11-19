// Calls `onFrame` every time the video shows a new frame.
//
// requestVideoFrameCallback (rVFC) is the best tool for this: the browser calls
// us once for every frame it puts on screen and tells us that frame's exact
// time (`mediaTime`) and how many frames it has shown so far
// (`presentedFrames`). It only fires once per callback, so we ask again each
// time.
//
// Some browsers don't have it, so we fall back to requestAnimationFrame, which
// runs before every screen repaint (about 60 times a second), and only report
// when the video's currentTime has actually changed.

/** Called with the frame's time in seconds, and the frame count if known. */
export type FrameListener = (mediaTime: number, presentedFrames: number | null) => void

/** Starts watching. Returns a function that stops watching. */
export function watchVideoFrames(video: HTMLVideoElement, onFrame: FrameListener): () => void {
  let stopped = false

  if (typeof video.requestVideoFrameCallback === 'function') {
    let handle = 0
    const onVideoFrame: VideoFrameRequestCallback = (_now, metadata) => {
      if (stopped) return
      onFrame(metadata.mediaTime, metadata.presentedFrames)
      handle = video.requestVideoFrameCallback(onVideoFrame) // ask for the next one
    }
    handle = video.requestVideoFrameCallback(onVideoFrame)

    return () => {
      stopped = true
      video.cancelVideoFrameCallback(handle)
    }
  }

  // Fallback: check on every screen repaint.
  let handle = 0
  let lastTime = -1
  const onAnimationFrame = () => {
    if (stopped) return
    if (video.currentTime !== lastTime) {
      lastTime = video.currentTime
      onFrame(video.currentTime, null)
    }
    handle = requestAnimationFrame(onAnimationFrame)
  }
  handle = requestAnimationFrame(onAnimationFrame)

  return () => {
    stopped = true
    cancelAnimationFrame(handle)
  }
}
