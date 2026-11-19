import { Box, Button, Slider, Stack, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material'
import { useCallback, useEffect, useEffectEvent, useState, type ReactNode } from 'react'
import { isButtonTarget, isTypingTarget, shortcutForKey, type ShortcutAction } from './shortcuts'
import { seekBy, seekTo, setPlaybackSpeed, stepFrames, togglePlay } from './videoControls'
import { countFrames, DEFAULT_FPS, estimateFps, formatTime, PLAYBACK_SPEEDS, timeToFrame } from './videoMath'
import { watchVideoFrames } from './watchVideoFrames'

export type VideoPlayerProps = {
  /** URL of the video */
  src: string
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
      <Box sx={{ position: 'relative', lineHeight: 0, bgcolor: 'common.black', borderRadius: 1, overflow: 'hidden' }}>
        <video
          ref={attachVideo}
          src={src}
          preload="auto"
          playsInline
          data-testid="video"
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />
        {children}
      </Box>

      <Slider
        aria-label="Seek"
        size="small"
        min={0}
        max={duration || 1}
        step={1 / fps}
        value={Math.min(currentTime, duration || 1)}
        disabled={!duration}
        onChange={(_, value) => {
          if (video && typeof value === 'number') seekTo(video, value)
        }}
        sx={{ mt: 1 }}
      />

      <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <Tooltip title="One frame back (,)">
          <Button variant="outlined" size="small" onClick={() => runShortcut('frame-back')} aria-label="Previous frame">
            ◀|
          </Button>
        </Tooltip>
        <Tooltip title="Play / pause (Space)">
          <Button variant="contained" size="small" onClick={() => runShortcut('toggle-play')} sx={{ minWidth: 90 }}>
            {playing ? 'Pause' : 'Play'}
          </Button>
        </Tooltip>
        <Tooltip title="One frame forward (.)">
          <Button variant="outlined" size="small" onClick={() => runShortcut('frame-forward')} aria-label="Next frame">
            |▶
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
            <ToggleButton key={option} value={option} aria-label={`${option}x speed`}>
              {option}×
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Typography variant="body2" sx={{ fontFamily: 'monospace' }} data-testid="current-time">
          {formatTime(currentTime)} / {formatTime(duration)}
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }} data-testid="frame-number">
          Frame {frame} / {totalFrames}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {measuredFps === null ? `${DEFAULT_FPS} fps (assumed)` : `${measuredFps} fps`}
        </Typography>
      </Stack>
    </Box>
  )
}
