// Pure helpers for time, frame numbers and sizes. No React or DOM here, so they
// are easy to unit test (see tests/player/videoMath.test.ts).

/** Used until the player has measured the real frame rate. */
export const DEFAULT_FPS = 25

/** Speeds offered by the speed buttons. */
export const PLAYBACK_SPEEDS = [0.25, 0.5, 1, 1.5, 2]

/**
 * Which frame is showing at this time. Frame 0 starts at 0 s.
 * The tiny 0.001 makes up for rounding errors, e.g. 0.12 * 25 = 2.9999999.
 */
export function timeToFrame(seconds: number, fps: number): number {
  return Math.max(0, Math.floor(seconds * fps + 0.001))
}

/**
 * The time to seek to so a frame shows. We aim for the middle of the frame,
 * so a small rounding error can never land on the frame before it.
 */
export function frameToTime(frame: number, fps: number): number {
  return (frame + 0.5) / fps
}

/** How many whole frames a video of this length has. */
export function countFrames(durationSeconds: number, fps: number): number {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return 0
  return Math.max(1, timeToFrame(durationSeconds, fps))
}

/** Keeps a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Turns the time between two video frames into frames per second.
 * Returns null for gaps that can't be one frame (e.g. after a seek).
 * Rounded to 2 decimals so 29.97 fps videos keep their real rate.
 */
export function estimateFps(secondsBetweenFrames: number): number | null {
  if (secondsBetweenFrames <= 0) return null
  const fps = 1 / secondsBetweenFrames
  if (fps < 5 || fps > 240) return null
  return Math.round(fps * 100) / 100
}

/** 3.456 -> "0:03.45" (minutes, seconds, hundredths). */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0
  const minutes = Math.floor(seconds / 60)
  const rest = seconds - minutes * 60
  const whole = Math.floor(rest)
  const hundredths = Math.floor((rest - whole) * 100)
  return `${minutes}:${String(whole).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`
}

/** Size to read a frame at, and how much smaller that is than the video. */
export type ReadSize = { width: number; height: number; scale: number }

/**
 * Big videos are read at a smaller size so the analysis stays fast.
 * A 1920x1080 video with maxWidth 640 is read at 640x360, scale 1/3.
 * Small videos are read at full size (scale 1).
 */
export function pickReadSize(videoWidth: number, videoHeight: number, maxWidth: number): ReadSize {
  if (videoWidth <= maxWidth) return { width: videoWidth, height: videoHeight, scale: 1 }
  const scale = maxWidth / videoWidth
  return { width: maxWidth, height: Math.max(1, Math.round(videoHeight * scale)), scale }
}
