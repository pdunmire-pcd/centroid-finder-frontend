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
