import { Alert, Box, Button, Slider, Stack, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material'
import { useCallback, useEffect, useEffectEvent, useState, type ReactNode } from 'react'
import { isButtonTarget, isTypingTarget, shortcutForKey, type ShortcutAction } from './shortcuts'
import { describeMediaError } from './localVideo'
import { loadVideo, seekBy, seekTo, setPlaybackSpeed, stepFrames, togglePlay } from './videoControls'
import { countFrames, DEFAULT_FPS, estimateFps, formatTime, PLAYBACK_SPEEDS, timeToFrame } from './videoMath'
import { watchVideoFrames } from './watchVideoFrames'
import { monoFontFamily } from '../../theme'

export type VideoPlayerProps = {
  /** URL of the video, or a File from the user's computer */
  src: string | File
  /** Gives the parent the <video> element, e.g. to read its frames. */
  onVideoElement?: (video: HTMLVideoElement | null) => void
  /** Drawn on top of the video, e.g. the trajectory canvas. */
  children?: ReactNode
}

/**
 * A <video> with our own controls: play/pause, frame stepping, a scrub bar,
 * speed buttons, time and frame number.
 *
 * Shortcuts: Space = play/pause, "," and "." = one frame back/forward,
 * left/right arrows = 1 second back/forward.
 */
export function VideoPlayer({ src, onVideoElement, children }: VideoPlayerProps) {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState(1)
  // null until we have measured the frame rate from the video itself
  const [measuredFps, setMeasuredFps] = useState<number | null>(null)
  // The error belongs to the src it happened with, so a new src starts clean.
  const [failure, setFailure] = useState<{ src: string | File; message: string } | null>(null)
  const errorMessage = failure?.src === src ? failure.message : null

  const fps = measuredFps ?? DEFAULT_FPS
  const frame = timeToFrame(currentTime, fps)
  const totalFrames = countFrames(duration, fps)

  // A callback ref: React calls it with the element (and with null on unmount).
  // We keep the element ourselves and also hand it to the parent.
  const attachVideo = useCallback(
    (element: HTMLVideoElement | null) => {
      setVideo(element)
      onVideoElement?.(element)
    },
    [onVideoElement],
  )

  // Load the video. A File from the user's computer has no URL, so we ask the
  // browser for a temporary "blob:" URL that points at the file in memory.
  // The cleanup revokes (frees) it when the file changes or the player closes.
  useEffect(() => {
    if (!video) return
    const url = typeof src === 'string' ? src : URL.createObjectURL(src)
    loadVideo(video, url)
    return () => {
      if (typeof src !== 'string') URL.revokeObjectURL(url)
    }
  }, [video, src])

  // If the browser can't play the file, the <video> fires an "error" event.
  useEffect(() => {
    if (!video) return
    const onError = () => setFailure({ src, message: describeMediaError(video.error?.code) })
    video.addEventListener('error', onError)
    return () => video.removeEventListener('error', onError)
  }, [video, src])

  // Keep our state in sync with what the <video> element is doing.
  useEffect(() => {
    if (!video) return

    const updatePlaying = () => setPlaying(!video.paused)
    const updateDuration = () => setDuration(Number.isFinite(video.duration) ? video.duration : 0)
    const updateTime = () => setCurrentTime(video.currentTime)
    const updateSpeed = () => setSpeed(video.playbackRate)

    video.addEventListener('play', updatePlaying)
    video.addEventListener('pause', updatePlaying)
    video.addEventListener('loadedmetadata', updateDuration)
    video.addEventListener('durationchange', updateDuration)
    video.addEventListener('seeked', updateTime)
    video.addEventListener('ratechange', updateSpeed)

    // On every new frame: update the time, and measure the frame rate from the
    // gap between two frames that came straight after each other.
    let lastTime = -1
    let lastCount = -1
    const stopWatching = watchVideoFrames(video, (mediaTime, presentedFrames) => {
      setCurrentTime(mediaTime)
      if (presentedFrames !== null && presentedFrames === lastCount + 1 && !video.paused) {
        const measured = estimateFps(mediaTime - lastTime)
        if (measured !== null) setMeasuredFps(measured)
      }
      lastTime = mediaTime
      lastCount = presentedFrames ?? -1
    })

    return () => {
      stopWatching()
      video.removeEventListener('play', updatePlaying)
      video.removeEventListener('pause', updatePlaying)
      video.removeEventListener('loadedmetadata', updateDuration)
      video.removeEventListener('durationchange', updateDuration)
      video.removeEventListener('seeked', updateTime)
      video.removeEventListener('ratechange', updateSpeed)
    }
  }, [video])

  // Buttons and keyboard shortcuts both end up here.
  const runShortcut = (action: ShortcutAction) => {
    if (!video) return
    if (action === 'toggle-play') togglePlay(video)
    else if (action === 'frame-back') stepFrames(video, -1, fps)
    else if (action === 'frame-forward') stepFrames(video, 1, fps)
    else if (action === 'seek-back') seekBy(video, -1)
    else seekBy(video, 1)
  }

  // useEffectEvent: the listener always sees the latest state, but we only
  // add it to the window once.
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const action = shortcutForKey(event.key)
    if (!action || event.ctrlKey || event.metaKey || event.altKey) return

    const target = event.target instanceof HTMLElement ? event.target : null
    if (isTypingTarget(target)) return
    if (action === 'toggle-play' && isButtonTarget(target)) return

    event.preventDefault() // stop Space from scrolling the page
    runShortcut(action)
  })

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <Box>
      {/* lineHeight 0 removes the gap under the video, so overlays line up */}
      <Box sx={{ position: 'relative', lineHeight: 0, bgcolor: '#000', borderRadius: 1, overflow: 'hidden' }}>
        <video
          ref={attachVideo}
          preload="auto"
          playsInline
          data-testid="video"
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />
        {children}
      </Box>

      {errorMessage && (
        <Alert severity="error" sx={{ mt: 1 }} data-testid="video-error">
          {errorMessage}
        </Alert>
      )}

      <Slider
        aria-label="Seek"
        // screen readers hear "0:03.20 of 0:30.03" instead of a raw number of seconds
        getAriaValueText={(value) => `${formatTime(value)} of ${formatTime(duration)}`}
        size="small"
        min={0}
        max={duration || 1}
        step={1 / fps}
        value={Math.min(currentTime, duration || 1)}
        disabled={!duration}
        onChange={(_, value) => {
          if (video && typeof value === 'number') seekTo(video, value)
        }}
        // a little inset, so the thumb at 0:00 isn't cut off by the card edge
        sx={{ mt: 1.5, mx: 1, width: 'calc(100% - 16px)' }}
      />

      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        role="group"
        aria-label="Video controls"
        sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1.5 }}
      >
        <Tooltip title="One frame back (,)">
          <Button
            variant="outlined"
            size="small"
            onClick={() => runShortcut('frame-back')}
            aria-label="Previous frame"
            sx={{ minWidth: 44, px: 1 }}
          >
            <StepIcon direction="back" />
          </Button>
        </Tooltip>
        <Tooltip title="Play / pause (Space)">
          <Button
            variant="contained"
            size="small"
            onClick={() => runShortcut('toggle-play')}
            startIcon={playing ? <PauseIcon /> : <PlayIcon />}
            sx={{ minWidth: 96 }}
          >
            {playing ? 'Pause' : 'Play'}
          </Button>
        </Tooltip>
        <Tooltip title="One frame forward (.)">
          <Button
            variant="outlined"
            size="small"
            onClick={() => runShortcut('frame-forward')}
            aria-label="Next frame"
            sx={{ minWidth: 44, px: 1 }}
          >
            <StepIcon direction="forward" />
          </Button>
        </Tooltip>

        <ToggleButtonGroup
          size="small"
          exclusive
          value={speed}
          onChange={(_, value: number | null) => {
            if (video && value !== null) setPlaybackSpeed(video, value)
          }}
          aria-label="Playback speed"
        >
          {PLAYBACK_SPEEDS.map((option) => (
            // The visible text ("2x") is part of the name ("2x speed"), as WCAG 2.5.3 asks
            <ToggleButton key={option} value={option} aria-label={`${option}x speed`} sx={{ px: 1.25 }}>
              {option}x
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        {/* Time, frame and fps: monospace with tabular digits, so they don't jitter */}
        <Stack direction="row" spacing={2} useFlexGap sx={{ alignItems: 'baseline', flexWrap: 'wrap', ml: { md: 'auto' } }}>
          <Typography variant="body2" sx={{ fontFamily: monoFontFamily }} data-testid="current-time">
            {formatTime(currentTime)} / {formatTime(duration)}
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: monoFontFamily }} data-testid="frame-number">
            Frame {frame} / {totalFrames}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {measuredFps === null ? `${DEFAULT_FPS} fps (assumed)` : `${measuredFps} fps`}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  )
}

// Small icons for the controls, drawn here so no icon package is needed.
// They are aria-hidden: the buttons' text or aria-label names them.

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 2.5v11l9-5.5z" fill="currentColor" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="3.5" y="2.5" width="3" height="11" rx="1" fill="currentColor" />
      <rect x="9.5" y="2.5" width="3" height="11" rx="1" fill="currentColor" />
    </svg>
  )
}

/** A triangle and a bar: "step one frame" back or forward. */
function StepIcon({ direction }: { direction: 'back' | 'forward' }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
      style={{ transform: direction === 'back' ? 'scaleX(-1)' : undefined }}
    >
      <path d="M3 3v10l7-5z" fill="currentColor" />
      <rect x="11" y="3" width="2" height="10" rx="1" fill="currentColor" />
    </svg>
  )
}
