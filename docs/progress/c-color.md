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
