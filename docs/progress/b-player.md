# Workstream B: Video player and Analyze page — progress

## Task 1: useCentroidFrame hook — done

Moved the "binarize, find groups, draw" logic out of `BinarizedPreview` into a
shared hook, `useCentroidFrame(image, targetColor, threshold, onAnalysed?)`, so a
still image and video frames use exactly the same code. The hook calls the
engine's `analyzeFrame` inside `requestAnimationFrame` (so fast slider drags only
compute the latest value), draws the black-and-white image plus a red dot on the
canvas you attach with the returned `canvasRef`, and gives back the analysis and
the largest group.

- Files: `src/hooks/useCentroidFrame.ts` (new), `src/components/player/drawing.ts`
  (new: `binaryToRgba`, `drawCentroidDot`), `src/components/BinarizedPreview.tsx`
  (now uses the hook), `tests/player/drawing.test.ts` (new).
- Tested: the 6 existing `BinarizedPreview` Cypress component tests still pass
  (same 41070 px group at (1185, 933)); 2 new Vitest tests for `binaryToRgba`.
- Surprising: the canvas is kept in React state (a callback ref) instead of a
  `useRef`, so when a new canvas mounts (e.g. after switching view mode) the hook
  notices and draws on it straight away. The `onAnalysed` callback goes through
  React 19's `useEffectEvent`, so the effect does not re-run when the parent
  passes a new function.

## Task 2: VideoPlayer with custom controls — done

Built `VideoPlayer`, a `<video>` with MUI controls: Play/Pause, one frame back
and forward, a scrub slider, speed buttons (0.25×–2×), the current time and the
frame number. It assumes 25 fps until it has measured the real rate from
`requestVideoFrameCallback` (the gap in `mediaTime` between two frames shown one
after the other). Keyboard: Space, `,` and `.`, and the left/right arrows (±1 s);
shortcuts are ignored while typing in inputs, and Space is left to the browser
when a button has focus (otherwise it would toggle twice).

- Files: `src/components/player/VideoPlayer.tsx`, `videoControls.ts` (play,
  seek, step, speed), `videoMath.ts` (frame/time maths), `shortcuts.ts`,
  `watchVideoFrames.ts` (rVFC with a requestAnimationFrame fallback);
  tests `tests/player/videoMath.test.ts`, `tests/player/shortcuts.test.ts`,
  `cypress/component/player/VideoPlayer.cy.tsx`.
- Tested: 17 new Vitest tests; 6 Cypress component tests with the real sample
  video (play/pause, frame stepping changes the frame number, keyboard, speed,
  no shortcuts while typing).
- Surprising: (1) the React Compiler lint rule forbids changing a value that
  came from `useState` (`video.currentTime = …`), so those commands live in
  `videoControls.ts` as plain functions that take the video. (2) Stepping seeks
  to the *middle* of the next frame, so a rounding error can never show the
  frame before. (3) In Cypress component tests the `public/` folder is served
  under `import.meta.env.BASE_URL` (`/__cypress/src/`), not at `/`.

## Task 3: useVideoFrames hook — done

`useVideoFrames(video, maxWidth = 640)` reads the frame on screen into an
`ImageData` every time a new one shows (via `watchVideoFrames`, so
`requestVideoFrameCallback` with a `requestAnimationFrame` fallback), and also
on `seeked` and `loadeddata`, so stepping while paused updates too. It uses
`createImageBitmap(video, { colorSpaceConversion: 'none', resizeWidth, resizeHeight })`
— the same color-safe read as `BinarizedPreview` — and draws the bitmap on an
offscreen canvas to get the pixels. A 1920x1080 video is read at 640x360 and
the hook returns `scale` (here 1/3) with the frame's `time` and full video size.

- Files: `src/hooks/useVideoFrames.ts` (new),
  `cypress/component/player/useVideoFrames.cy.tsx` (new).
- Tested: 3 Cypress component tests with the sample video (first frame is read
  at 640x360, stepping while paused reads a new frame at the right time, pixels
  are real colors).
- Surprising: reading a frame is asynchronous, so a new frame can arrive while
  the last one is still being read. The hook keeps a `busy` flag and remembers
  only the newest waiting frame; frames in between are skipped on purpose,
  which is how the page stays smooth on slow computers.

## Task 4: Live overlay and trajectory — done

`AnalyzeViewer` joins the pieces: `VideoPlayer` → `useVideoFrames` →
`useCentroidFrame` → overlays. While the video plays, each analysed frame adds
a point (seconds, x, y in full video pixels, or -1,-1 for no match) to the
trail. Over the video sit two transparent canvases: `CrosshairOverlay` on the
current centroid and the improved `TrajectoryCanvas` (older parts fainter, line
breaks at no-match points and at jumps over 1 s, `onPointClick` seeks the video
and pointer events are only on when a handler is given). "Clear trail" empties
the list.

- Files: `src/components/player/AnalyzeViewer.tsx`, `CrosshairOverlay.tsx`,
  `trackPoints.ts` (new); `drawing.ts` (+ `drawCrosshair`);
  `src/components/shared/TrajectoryCanvas.tsx` (same props, better drawing).
  Tests: `tests/player/trackPoints.test.ts`,
  `cypress/component/player/TrajectoryCanvas.cy.tsx`,
  `cypress/component/player/AnalyzeViewer.cy.tsx`.
- Tested: 11 new Vitest tests; 5 TrajectoryCanvas component tests (fading,
  breaks, click → point, pass-through without handler); 3 AnalyzeViewer tests
  with the sample video (balloon found, trail grows while playing and clears,
  stepping does not record). A screenshot showed 96 points after 3.8 s, so at
  640 px the analysis keeps up with all 25 fps.
- Surprising: a CSS grid column of `1fr` will not shrink below the video's
  natural 1920 px width, so the second panel overflowed; `minmax(0, 1fr)` fixes it.

## Task 5: View modes — done

A toggle group above the player switches between "Side by side" (original with
overlay | binarized), "Original" and "Binarized". In binarized mode the
black-and-white canvas is laid over the video, with the trail and crosshair on
top, and the player controls stay underneath.

- Files: `src/components/player/AnalyzeViewer.tsx`,
  `cypress/component/player/AnalyzeViewer.cy.tsx`.
- Tested: a component test switches through all three modes, checks the
  binarized canvas is redrawn (640 px wide) after it moves, and that the same
  `<video>` element (and frame number) survives.
- Surprising: the player Paper is always the first child of the grid, so React
  keeps the same `<video>` and playback isn't interrupted. The binarized
  canvas does move, which is why Task 1 kept the canvas in state: the hook
  sees the new canvas and draws on it at once, even while paused.

## Task 6: Local files — done

`VideoPlayer` (and so `AnalyzeViewer`) now takes `src: string | File`. For a
File it makes a temporary `blob:` URL with `URL.createObjectURL(file)` inside an
effect, and the effect's cleanup calls `URL.revokeObjectURL` when the file
changes or the player unmounts, so the memory is freed. If the `<video>` fires
an `error` event, a clear message is shown (e.g. "Your browser cannot play this
video format. Try converting it to MP4 (H.264)."). New `LocalVideoPicker`
(button + hidden `<input type="file" accept="video/*">`) and `VideoDropZone`
(drag and drop), plus pure checks: `localFileError` (not a video) and
`localFileWarning` (over 2 GB).

- Files: `src/components/player/localVideo.ts`, `LocalVideoPicker.tsx` (new);
  `VideoPlayer.tsx`, `AnalyzeViewer.tsx`, `videoControls.ts` (`loadVideo`).
  Tests: `tests/player/localVideo.test.ts`,
  `cypress/component/player/LocalVideo.cy.tsx`.
- Tested: 7 Vitest tests; 4 component tests (a File plays through a `blob:`
  URL, a fake .mp4 shows the decode error, picker and drag-and-drop call
  `onFile` with the file from `cy.selectFile`).
- Moved to Task 7: disabling Process (with a tooltip) for local videos lives on
  the page, which is where `ProcessingControls` is used.
- Surprising: creating the URL in an effect (not in `useMemo`) matters in
  React's StrictMode, which runs effects twice in development: the first
  cleanup revokes the URL, and the second run makes a fresh one.

## Task 7: AnalyzePage and routes — done

`AnalyzePage` works out the source from the URL: `/analyze/:filename` is a
server video (played from `getVideoUrl`), `/analyze/local` takes the File from
`location.state.file`, and without one it shows an "Open a video from your
computer" panel. The whole page is a drop zone and has an "Open from this
computer" button; a picked file is checked, then opened with
`navigate('/analyze/local', { state: { file } })`. Each video gets its own
`AnalyzeSession` (keyed by source), which holds the threshold/color,
`ProcessingControls`, the job polling and the CSV link, and leaves a marked slot
for workstream C. For local videos Process is disabled, with an info message and
a tooltip saying why. While playing, a chip shows "analysing N of M fps" when
frames are being skipped (video frames come from `getVideoPlaybackQuality()`).

- Files: `src/pages/AnalyzePage.tsx` (new, also `PreviewRedirect`),
  `src/App.tsx` (route lines only), `src/pages/PreviewPage.tsx` (deleted:
  replaced by the Analyze page), `src/components/player/useFrameRates.ts` (new),
  `AnalyzeViewer.tsx` (readout), `drawing.ts` (bigger crosshair),
  `tests/player/frameRates.test.ts`.
- Tested: 3 Vitest tests for `describeFrameRates`; checked by hand with
  full-page screenshots (server video side by side; local file in binarized
  mode); the old `processing.cy.ts` E2E still passes through the redirect.
- Surprising: `ProcessingControls` disables its button when `filename` is
  empty, and changing that file belongs to someone else, so for local videos we
  pass `''`. The side effect is that the card says "Video: No video selected";
  a small `disabledReason` prop would fix it after the merge.

## Task 8: Tests — done

Added a component test for the whole page and the E2E test in mock mode, then
ran every suite. The page test mounts `AnalyzePage` in a `MemoryRouter` for a
server video (the `/videos/demo.mp4` request is redirected to the sample), a
threshold change, a local File in history state (Process disabled) and the
empty `/analyze/local` panel. The E2E test plays, pauses, steps 10 frames and
checks the frame number and centroid text change; it opens a local file with
`cy.selectFile` (button, empty-page panel, and drag-and-drop), rejects a CSV,
checks Process still works for server videos and that `/preview/...` redirects.

- Files: `cypress/component/player/AnalyzePage.cy.tsx`, `cypress/e2e/analyze.cy.ts`.
- Results: `tsc -b`, lint and build pass; Vitest 76/76; Cypress component
  32/32 (7 specs); Cypress E2E 7/7 (`analyze.cy.ts` 6, `processing.cy.ts` 1).
  The Cypress files were also typechecked with a temporary tsconfig (the
  project's `tsc -b` only covers `src`).
- Surprising: E2E ran against `vite --mode mock --port 5183 --strictPort` with
  `--config baseUrl=http://localhost:5183`, so it could not hit another
  worktree's dev server on 5173. Electron (Cypress's default browser) plays the
  H.264 sample fine.
