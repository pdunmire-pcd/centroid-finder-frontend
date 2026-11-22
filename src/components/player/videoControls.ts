// Small functions that tell a <video> element what to do.
// Keeping them here (instead of inside the component) means the player
// buttons, the keyboard shortcuts and the trajectory clicks all share them.

import { clamp, countFrames, frameToTime, timeToFrame } from './videoMath'

/** Starts loading a new video from a URL. */
export function loadVideo(video: HTMLVideoElement, url: string) {
  video.src = url
}

export function togglePlay(video: HTMLVideoElement) {
  if (video.paused) {
    // play() returns a promise that rejects if the browser blocks playback;
    // the button simply stays on "Play" then.
    video.play().catch(() => {})
  } else {
    video.pause()
  }
}

/** Jumps to a time in seconds, kept inside the video. */
export function seekTo(video: HTMLVideoElement, seconds: number) {
  const duration = Number.isFinite(video.duration) ? video.duration : 0
  video.currentTime = clamp(seconds, 0, duration)
}

export function seekBy(video: HTMLVideoElement, seconds: number) {
  seekTo(video, video.currentTime + seconds)
}

/** Pauses and moves `frames` frames forward (or back if negative). */
export function stepFrames(video: HTMLVideoElement, frames: number, fps: number) {
  video.pause()
  const lastFrame = Math.max(0, countFrames(video.duration, fps) - 1)
  const current = timeToFrame(video.currentTime, fps)
  const target = clamp(current + frames, 0, lastFrame)
  video.currentTime = frameToTime(target, fps)
}

export function setPlaybackSpeed(video: HTMLVideoElement, speed: number) {
  video.playbackRate = speed
  video.defaultPlaybackRate = speed // keeps the speed if the video reloads
}
