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
