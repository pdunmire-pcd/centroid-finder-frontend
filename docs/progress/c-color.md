# Workstream C: Tracking Color tools and quality warnings — progress

## Task 1: ColorSampler — done

Built `ColorSampler`, a canvas that shows the current frame with a crosshair
cursor. Clicking takes the median color of a 1×1, 3×3, 5×5 or 9×9 square
around the click (using the engine's `sampleRegion`) and adds it to a list
that shows a swatch, hex, RGB, video time, position and area size, each with a
Remove button. It is a controlled component (`samples` + `onSamplesChange`),
and it also works with the keyboard: arrow keys move a square, Enter samples.

Files: `src/components/color/ColorSampler.tsx`, `src/components/color/colorUtils.ts`,
`tests/color/colorUtils.test.ts`, `cypress/component/color/ColorSampler.cy.tsx`,
`cypress/component/color/frames.ts`.

Tested: Vitest for the helpers (hex/RGB formatting, click-to-pixel scaling).
Cypress builds a 20×20 frame of #660005 with one white noise pixel: a 1×1
click gets the exact color, a 1×1 click on the noise gets white, a 3×3 click
on the noise still gets #660005 (median), remove works, keyboard sampling works.

Surprising: `cy.stub()`'s `calledWithMatch` does not partially match objects
inside arrays, so the test reads the stub's arguments directly instead.

## Task 2: Target color from samples — done

Built `TargetColorFromSamples`. It calls the engine's `summarizeSamples` to get
the average (mean) color of all samples and the spread (the furthest sample's
distance from that average), shows both, puts the spread into plain words
("Very consistent" ... "Very varied: some samples may be background"), and has
a "Use this color" button that hands the average hex to the parent. Also added
a tiny shared `ColorSwatch` component.

Files: `src/components/color/TargetColorFromSamples.tsx`,
`src/components/color/ColorSwatch.tsx`, `src/components/color/colorUtils.ts`
(`describeSpread`), `src/components/color/ColorSampler.tsx` (uses the swatch),
`tests/color/colorUtils.test.ts`, `cypress/component/color/TargetColorFromSamples.cy.tsx`.

Tested: Vitest for `describeSpread`; Cypress checks the average of
(100,0,0) and (110,0,10) is #690005 with spread 7.1, that the button sends
that hex, and that it is disabled when the average is already the target.

## Task 3: Suggested threshold — done

Built `ThresholdSuggestion`. It calls the engine's `suggestThreshold`, which
takes the furthest sample's distance from the average color, adds a safety
margin (slider, default 15) and 1 (because the binarizer keeps only pixels with
distance strictly less than the threshold), and rounds up. The suggestion is
shown next to the current threshold with an Apply button and a one-line
explanation of the sum. If the target color is not the samples' average, an
info note says to click "Use this color" first, since the number is measured
from the average.

Files: `src/components/color/ThresholdSuggestion.tsx`,
`cypress/component/color/ThresholdSuggestion.cy.tsx`.

Tested: Cypress: samples 7.07 from their average give 24 with margin 15,
Apply sends 24, three right-arrow presses on the margin slider give 27, the
"not the average" note shows, and Apply is disabled when already applied.

Surprising: MUI 9 puts `aria-labelledby` on the slider's hidden `<input>`, not
on the outer element, so tests select `input[aria-labelledby=...]`.

## Task 4: DistanceHistogram and DistanceMap — done

`DistanceHistogram` is a plain SVG bar chart of the engine's
`distanceHistogram` (100 bars over distances 0–442), with an orange vertical
line at the threshold, bars left of the line in the theme's green, a log-scale
switch (on by default so the small animal bump is visible next to the huge
background bump), and a caption on how to read it. `DistanceMap` is a canvas
that paints each pixel by its distance to the target: white = same color,
orange = exactly at the threshold, black = twice the threshold or more.

Files: `src/components/color/DistanceHistogram.tsx`,
`src/components/color/DistanceMap.tsx`, `src/components/color/colorUtils.ts`
(`histogramHeights`, `percentBelowThreshold`, `heatColor`, `distanceMapPixels`),
`tests/color/histogramAndMap.test.ts`, `cypress/component/color/DistanceHistogram.cy.tsx`.

Tested: Vitest for all four helpers. Cypress: threshold 221 puts the line at
x = 200 of 400, the line moves on rerender, a 10×10 frame with a 2×2 animal
reports 4.0% left of the line, 50 bins draw 50 bars, the log switch changes bar
heights, and the distance map paints the animal white and the background black.

Surprising: nothing major. The histogram is memoised on frame + color only,
so dragging the threshold slider just moves the line without recounting.

## Task 5: TrackingColorLegend — done

Built `TrackingColorLegend`, a small see-through dark chip (swatch, hex, RGB,
threshold) that a parent can position over a video or image with `sx`; it
ignores clicks so the video underneath stays usable. Added
`contrastingMarkerColor(targetColor)` in `colorUtils.ts`: from five bright
candidate colors it returns the one furthest (by the same Euclidean distance)
from the tracking color, e.g. cyan for the dark red salamander, for the overlay
to draw the centroid / track in.

Files: `src/components/color/TrackingColorLegend.tsx`,
`src/components/color/colorUtils.ts`, `tests/color/colorUtils.test.ts`,
`cypress/component/color/TrackingColorLegend.cy.tsx`.

Tested: Vitest (cyan for #660005, magenta for green, always a candidate);
Cypress (shows hex, RGB, threshold and aria-label; parent `sx` positions it).

## Task 6: LiveStatsPanel and WarningsPanel — done

`LiveStatsPanel` takes the `FrameAnalysis` from the engine's `analyzeFrame`
and shows matching pixels %, number of groups, the largest group's centroid
and size, and the second-largest / largest size ratio (near 100% means two
similar blobs, so the tracker could jump). `WarningsPanel` takes the
`Warning[]` from `checkFrameQuality` and shows each as a colored MUI Alert with
the message as title and "Fix: …" below. "Looks good" appears only for an
empty list; `null` (nothing checked yet) shows a waiting message instead.

Files: `src/components/quality/LiveStatsPanel.tsx`,
`src/components/quality/WarningsPanel.tsx`, `src/components/quality/qualityUtils.ts`,
`tests/color/quality.test.ts`, `cypress/component/quality/WarningsPanel.cy.tsx`.

Tested: Vitest for `computeLiveStats` and `warningSeverity`; Cypress for
"Looks good" vs warnings vs waiting, the severity colors, and the stat values.

Surprising: the shared `Warning` type has no severity field, so severity is
derived from the code (`no-match` and `too-many-matching` = error, the rest =
warning) in `warningSeverity`. The baseline `checkFrameQuality` only reports
`no-match` until workstream A's checks land, so the 24-groups example will
only warn after merging A.

## Task 7: Request preview — done

Built `RequestPreview`, which shows the exact call the Process button will
send, e.g. `POST /process/salamander1.mp4?targetColor=660005&threshold=67`,
with a Copy button (uses `navigator.clipboard`, wrapped in try/catch, with an
`aria-live` "Copied" / "Could not copy" message). The text comes from
`buildProcessRequest` in `colorUtils.ts`, which builds the URL the same way as
`processVideo` in `src/api.ts` (`encodeURIComponent` + `URLSearchParams`).

Files: `src/components/color/RequestPreview.tsx`, `src/components/color/colorUtils.ts`,
`tests/color/colorUtils.test.ts`, `cypress/component/color/RequestPreview.cy.tsx`.

Tested: Vitest for `buildProcessRequest` (plain and with a space in the
filename); Cypress for the shown text, encoding, copying (clipboard stubbed)
and the failure message.

Surprising: `cy.stub().resolves()` returns a plain Sinon stub, so `.as()` must
come before `.resolves()` for TypeScript.

## Task 8: Saved color profiles and ColorToolsPanel — done

`useColorProfiles` keeps a list of named `ColorProfile`s in localStorage
(every read and write wrapped in try/catch; broken data gives an empty list;
saving an existing name replaces it). `ColorProfiles` is the UI: a name field
with Save, and a list with Load and Delete. `ColorToolsPanel` puts it all
together: current-settings legend, sampler, average color, threshold
suggestion, profiles and request preview. It keeps the samples itself and
only needs the frame, time, filename, color, threshold and two change callbacks.

Files: `src/hooks/useColorProfiles.ts`, `src/components/color/ColorProfiles.tsx`,
`src/components/color/ColorToolsPanel.tsx`, `tests/color/useColorProfiles.test.ts`,
`cypress/component/color/ColorToolsPanel.cy.tsx`.

Tested: Vitest for read/write/upsert with a fake storage (including broken
JSON and a storage that throws). Cypress: click → Use this color → Apply ends
in `...targetColor=660005&threshold=16`; saving writes localStorage, and after
a remount Load restores color and samples, and Delete removes it.

Surprising: the pure storage functions take the storage as a parameter, so
they can be tested in Node, where `window.localStorage` does not exist.

## Task 9: Interim integration on PreviewPage — done

`PreviewPage` now loads the thumbnail into `ImageData` once (small local
`useImageData` hook) and passes it to `ColorToolsPanel` (left column, which
replaces the old "Original" image, since the sampler canvas shows the same
frame), and to the binarized preview, a "Frame check" card (`LiveStatsPanel`
+ `WarningsPanel`, fed by `analyzeFrame` / `checkFrameQuality` with
`useDeferredValue` so slider drags stay smooth), the histogram and the
distance map. `ProcessingControls` got "Exact match" / "Any color" labels
under the 0–442 slider, a numeric threshold box (clamped to 0–442) and a
one-line explanation of the threshold.

Files: `src/pages/PreviewPage.tsx`, `src/components/ProcessingControls.tsx`,
`src/components/color/ColorSampler.tsx` (row padding),
`cypress/component/color/ProcessingControls.cy.tsx`.

Tested: all 37 component tests and the existing e2e test pass against a mock
dev server; a temporary screenshot spec (not committed) clicked two samples,
used the color, applied the threshold and showed every panel working.

Surprising: (1) reading `bitmap.width` after `bitmap.close()` gives 0, so the
frame never loaded at first; now the canvas size is used. (2) Port 5173 was
already taken by another agent's dev server, so my e2e run used port 5391.
(3) Earlier `git add -A` commits had picked up two Cypress failure
screenshots; they are removed in this commit (`cypress/screenshots` is not in
`.gitignore`, which I don't own; suggest adding it at merge). (4) On the mock
thumbnail with a grey wall color the page shows 1105 groups and still "Looks
good" — exactly the problem from the brief — because the baseline
`checkFrameQuality` only checks no-match; workstream A's checks fix this.

## Task 10: Tests — done

Most tests were written with each task (see above). This task added a
Cypress test that samples the real `extractedFrame.png` fixture: decoded in
the browser without color conversion, a 1×1 click on frame pixel (1185, 933)
gives rgb(162, 166, 41) and a 9×9 click gives the median rgb(161, 166, 41),
the same values Node/sharp reads from the file.

Totals: 32 new Vitest tests in `tests/color/` (68 in the project) and 33 new
Cypress component tests in `cypress/component/color/` and
`cypress/component/quality/` (39 in the project); all pass, plus the existing
e2e test.

Files: `cypress/component/color/ColorSamplerFixture.cy.tsx`.

Surprising: Cypress rounds click positions to whole screen pixels, so
clicking an exact pixel of a 1920-wide frame shown at 480 px was off by up to
3 pixels. The test crops a 40×40 window and shows it 10× larger instead.
