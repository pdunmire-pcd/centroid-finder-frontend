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
