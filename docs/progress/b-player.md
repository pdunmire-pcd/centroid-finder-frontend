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
