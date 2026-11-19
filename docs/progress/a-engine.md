# Workstream A: Centroid engine and performance — progress log

## Task 1: Fast group finder — done

**What I built.** `findConnectedGroupsFast(binary, width, height)` finds the same
connected groups as `findConnectedGroups`, but reads a flat `Uint8Array` (one
entry per pixel, `binary[y * width + x]`) and keeps its depth-first-search stack
in an `Int32Array` of pixel indexes instead of an array of `{x, y}` objects. A
sibling, `findConnectedGroupsWithBounds`, also returns each group's bounding box
(used later by the quality checks). The original `findConnectedGroups` is
untouched and stays the Java-matching reference.

**Files.** `src/centroid/fastGroupFinder.ts` (new), `src/centroid/index.ts`
(exports), `tests/centroid/fastGroupFinder.test.ts` (new).

**Tests.** 7 new tests (empty image, 4-connectivity, no wrap-around between rows,
match against the reference, re-use with different sizes, wrong-length input,
bounding boxes). Full suite: 43 passed.

**Surprising.** Neighbour checks must test `x + 1 < width` / `x > 0` before using
`index ± 1`, otherwise the last pixel of one row "touches" the first pixel of
the next row in the flat array. There is a test for this.

## Task 2: Fast binarizer and fast analyzeFrame — done

**What I built.** `binarizeInto(image, color, threshold, output?)` writes 1/0 for
every pixel into a flat `Uint8Array` (reusing `output` when given) and counts the
matching pixels in the same loop. It compares the *squared* distance against a
whole-number limit from `squaredThresholdLimit(threshold)`, so there is no
`Math.sqrt` per pixel. `analyzeFrame` now uses `binarizeInto` +
`findConnectedGroupsFast` instead of building `number[][]` arrays.

**Files.** `src/centroid/fastBinarizer.ts` (new), `src/centroid/engine.ts`,
`src/centroid/index.ts`, `tests/centroid/fastBinarizer.test.ts` (new).

**Tests.** 8 new tests, including one that checks `squaredThresholdLimit` against
`Math.sqrt(s) < threshold` for *every* possible squared distance (0 to 195075)
at 13 thresholds, including fractional ones. Full suite: 51 passed.

**Surprising.** Simply comparing with `threshold * threshold` is only safe for
whole-number thresholds; for a value like 164.5 the square is rounded by
floating point. The limit is therefore nudged up/down using `Math.sqrt` itself,
so the strict `<` from the Java code is kept exactly for any threshold.

## Task 3: Equivalence tests — done

**What I built.** A test file that runs the fast path (`analyzeFrame`) and the
Java-matching reference (`toBinaryArray` + `findConnectedGroups`) on the same
input and checks that the binary image, matching-pixel count and the full group
list (sizes, centroids, order) are identical. Random inputs come from a small
seeded random generator, so any failure can be repeated exactly.

**Files.** `tests/engine/equivalence.test.ts` (new), `tests/engine/helpers.ts`
(new: fixture loading, seeded random, random/solid images).

**Tests.** 11 new tests covering: both fixtures (`squares.jpg` 1280x720 and
`extractedFrame.png` 1920x1080) with 4 colors x 5 thresholds each, the Java
`groups.csv` output through `analyzeFrame`, 300 random palette images with random
fractional thresholds, 300 random binary images of random density, 1x1, all-on,
all-off, a full 1920x1080 all-on frame (2 million pixel group), single rows and
columns, zero/negative thresholds and a pixel exactly on the threshold.
`matchesJava.test.ts` still passes. Full suite: 62 passed.

**Surprising.** Comparing two 2-million-entry arrays with `toEqual` is very slow,
so the binary images are compared with a plain loop that reports the first
mismatching pixel.

## Task 4: `scale` option in analyzeFrame — done

**What I built.** `analyzeFrame(frame, color, threshold, scale)` with a scale
between 0 and 1 first makes a smaller nearest-neighbour copy of the frame
(each small pixel copies the original pixel nearest its centre), analyses that,
and converts centroids, sizes and bounding boxes back to full-size coordinates.
At scale 1 nothing changes and results still match Java exactly; at scale < 1
results are approximate (documented in the code). `FrameAnalysis` gained
optional fields: `bounds`, `sourceWidth`, `sourceHeight` and `scale`.

**Files.** `src/centroid/downscale.ts` (new), `src/centroid/engine.ts`,
`src/centroid/index.ts`, `tests/engine/scale.test.ts` (new).

**Tests.** 8 new tests: scale validation, downscale size and minimum 1x1, the new
fields at scale 1, invalid scale, a known rectangle at scale 0.5 (centroid within
2 px, exact size and exact bounds), edge-touching preserved, and the four big
squares in `squares.jpg` at scale 0.5 (centroids within 4 px, sizes within 5%).
Full suite: 70 passed.

**Decision.** `binary`, `width`, `height` and `matchingPixels` describe the small
copy (so `binary.length === width * height` always holds), while `groups` and
`bounds` are always in full-size coordinates, given by `sourceWidth/Height`.

## Task 5: Web Worker and `useFrameAnalysis` hook — done

**What I built.** `src/workers/centroidWorker.ts` is a module Web Worker that
receives `{ id, frame, color, threshold, scale }`, runs `analyzeFrame` and sends
the `FrameAnalysis` back, *transferring* the `binary` buffer instead of copying
it. `LatestFrameScheduler` makes sure only one frame is analysed at a time and
that, while busy, only the newest frame waits (older waiting frames are skipped
and their ImageBitmaps closed); it also counts analysed frames per second.
`useFrameAnalysis()` wraps all of this for React and falls back to the main
thread when `Worker` does not exist (Node tests).

**Files.** `src/workers/analysisRequest.ts` (message types, `answerRequest`,
ImageBitmap to pixels), `src/workers/centroidWorker.ts`,
`src/workers/frameScheduler.ts` (`LatestFrameScheduler`, `FpsCounter`),
`src/workers/runners.ts` (worker / main-thread runners),
`src/hooks/useFrameAnalysis.ts`, `tests/engine/worker.test.ts` (all new).

**Tests.** 10 new tests: the worker's message handler (result, error, transfer
list), main-thread fallback in Node, the fps counter with a fake clock, and the
scheduler step by step with a hand-controlled runner (stale frames skipped,
increasing ids, errors reported, results after `stop()` ignored). Full suite:
80 passed. I also checked that Vite bundles the worker as its own file
(`centroidWorker-*.js`, 3.5 kB).

**Surprising / limits.** The project's tsconfig only has DOM types, where `self`
is a `Window`; its `onmessage`/`postMessage(msg, { transfer })` shape is the same
as a worker's, so no extra lib is needed. There is no React testing library in
the project, so the hook itself is a thin wrapper and the logic is tested
through `LatestFrameScheduler`.
