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
