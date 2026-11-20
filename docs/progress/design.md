# Design workstream: "clean girl" redesign, accessibility, every screen size

Branch `upgrade/design`, built on `upgrade/integration`. The app does exactly
what it did before: same routes, API calls, processing, tracking maths and
file formats. Only the look, the accessibility and the layout change.

How to reproduce the checks in this log (never on ports 5173 / 3001):

```bash
npx vite --mode mock --port 5186 --strictPort          # terminal 1
# terminal 2: screenshots of every page, 4 widths, both themes
npx cypress run --spec cypress/design/screenshots.cy.ts \
  --config 'baseUrl=http://localhost:5186,specPattern=cypress/design/*.cy.ts' --expose shotSet=after
node scripts/save-design-screenshots.mjs after
# axe report (all impacts, never fails) -> JSON
npx cypress run --spec cypress/design/axe-report.cy.ts \
  --config 'baseUrl=http://localhost:5186,specPattern=cypress/design/*.cy.ts' \
  --expose axeOut=docs/progress/design-axe-after.json
```

## Step 0: baseline (before screenshots and axe report) — done

**What:** Added the tools for this workstream and recorded how the app looked
and what axe found *before* any design change.

- New pinned packages: `@fontsource-variable/fraunces@5.3.0`,
  `@fontsource-variable/inter@5.3.0`, `@fontsource-variable/jetbrains-mono@5.3.0`
  (self-hosted fonts, no CDN), and dev dependencies `axe-core@4.14.0` and
  `cypress-axe@1.7.0`. All were published more than two weeks ago
  (axe-core 4.14.1 is only 3 days old, so 4.14.0 is used).
- `cypress-axe` 1.7.0 declares Cypress ≤ 15 as its peer; it works with our
  Cypress 16, so `package.json` has an `overrides` entry that lets npm accept it
  instead of using `--legacy-peer-deps`.
- `cypress/support/designPages.ts`: the five pages (Videos, Analyze with
  `ensantina.mp4`, Jobs, Job results for `mock-job-125`, Not found) and a
  `visitInTheme()` helper that saves the light/dark choice before the page loads.
- `cypress/design/screenshots.cy.ts`: every page at 375, 768, 1280 and 1920 px
  wide in both themes. `cypress/design/axe-report.cy.ts`: writes every axe
  violation to JSON. Both live outside `cypress/e2e`, so the normal E2E run
  doesn't take 40 screenshots each time.
- `scripts/save-design-screenshots.mjs` turns the 2x PNGs into half-size JPEGs
  in `docs/progress/design-screenshots/<set>/` (23 MB of PNG → 2.8 MB).

Cypress 16 removed `Cypress.env()` for plain settings; the specs read their
options with `Cypress.expose()` and the command line passes `--expose`.

**Axe before** (`design-axe-before.json`, all impacts):

| Page | Theme | Violations |
| --- | --- | --- |
| Videos | light / dark | color-contrast (serious, 1 node), heading-order (moderate, 1) |
| Analyze | light | color-contrast (serious, 2), heading-order (moderate, 2), label-content-name-mismatch (serious, 9) |
| Analyze | dark | color-contrast (serious, 1), heading-order (moderate, 2), label-content-name-mismatch (serious, 9) |
| Jobs | light / dark | color-contrast (serious, 1), label-content-name-mismatch (serious, 5) |
| Job results | light / dark | none |
| Not found | light / dark | none |

**Screenshots:** `design-screenshots/before/<page>-<theme>-<width>.jpg`
(40 files). Note: in a full-page capture Cypress scrolls and stitches, so the
sticky top bar appears several times in the before pictures; the after
screenshots unstick it just for the capture.

## Step 1: design tokens, fonts, logo and contrast checks — done

**What:** `src/theme.ts` now holds the whole look as tokens, so components need
almost no one-off styles.

- **Palette** (`designTokens`, light / dark): ivory page `#FAF7F2` / espresso
  `#1E1915`; soft-white cards `#FFFDF9` / mocha `#27211C`; cream "subtle" areas
  `#F3EEE6` / `#302923`; sand hairlines `#E7DFD3` / `#3A322B`; taupe control
  borders `#8F8172` / `#8A7B6C`; espresso ink `#2E2A26` / cream `#F3ECE2`;
  taupe secondary text `#6B6158` / latte `#BFB2A3`. **One accent**, muted sage
  `#52705A` / pale sage `#A9C2A9`, only for primary actions, links, selected
  items and the focus ring. Clay `#9C5A3C` / `#E0A486` is a data highlight
  only (the histogram's threshold line). Status colors are muted (brick, ochre,
  moss, slate) and status chips are soft tints with colored text instead of
  solid blocks.
- **Chart colors** stay saturated and color-blind-separated
  (`chartSeriesColors`); the light-mode y line moved from `#eb6834` to
  `#d0561f` so it reaches 4.1:1 on the new card color (was 3.15:1).
- **Type:** Fraunces (variable serif) for headings, Inter (variable sans) for
  text and controls, JetBrains Mono for ids, hex codes, times and table data,
  all self-hosted from pinned `@fontsource-variable/*` packages imported in
  `main.tsx`. Headings use fluid sizes, e.g. h1 is
  `clamp(1.75rem, 1.35rem + 1.4vw, 2.5rem)`; the body keeps tabular digits.
- **Shape:** 14 px card radius, pill-shaped buttons and toggle groups, 12 px
  inputs and alerts, hairline borders, a very soft warm shadow in light mode
  (none in dark mode, where the hairline does the work), a translucent blurred
  top bar.
- **Global CSS** (in the theme's `CssBaseline`): one visible `:focus-visible`
  ring (2 px sage, 2 px offset) for everything; `prefers-reduced-motion`
  turns animations and transitions off; on touch screens
  (`pointer: coarse`) buttons, toggle buttons, clickable chips and icon buttons
  are at least 44 px; `color-scheme` follows the mode so native scrollbars and
  the color picker match.
- **`prefers-contrast: more`:** `AppThemeProvider` reads it with
  `useMediaQuery`, and `createAppTheme(mode, { highContrast })` then uses
  full-strength text for secondary text and real borders for hairlines.
- **Logo and favicon:** a new mark, a fine ring with its centroid dot and a
  fading two-dot trail on a soft tinted tile (`LogoMark.tsx`, inline SVG using
  the accent through `currentColor`); `public/favicon.svg` is the same
  drawing and switches to its dark colors with `prefers-color-scheme`. The old
  favicon was Vite's default. `index.html` got a description and light/dark
  `theme-color`.
- **Contrast checks:** `src/a11y/contrast.ts` implements the WCAG relative
  luminance and contrast ratio (plus `blend` for tints), and
  `tests/layout/contrast.test.ts` checks 27 pairs per mode: text, secondary
  text and links on every surface; text on the accent and on the selected
  wash; status text on cards and on their chip tint; control borders and the
  focus ring (3:1); chart lines (3:1). All 54 pass; the lowest are 4.75:1
  (sage link on the cream subtle area) for text and 3.54:1 (taupe control
  border on ivory) for non-text. The full table is at the end of this file.

**Files:** `src/theme.ts`, `src/main.tsx`, `src/components/layout/AppThemeProvider.tsx`,
`src/components/layout/LogoMark.tsx`, `public/favicon.svg`, `index.html`,
`src/a11y/contrast.ts`, `tests/layout/contrast.test.ts`.

**Checked:** tsc, lint, unit tests (contrast test included) and build on this
commit alone.

## Step 2: sharp canvases on high-DPI screens — done

**Problem:** a `<canvas>` has a CSS size (how big it looks) and a backing
store (`canvas.width/height`, how many real pixels it has). The overlays used
the *video's* pixel size as the backing store, so on a 2x Retina screen a
small video's trajectory, crosshair and dots were stretched and blurry (and
for a big video the canvas had many more pixels than needed).

**The pattern** (`src/components/shared/hiDpi.ts` + `src/hooks/useHiDpiCanvas.ts`):

1. A `ResizeObserver` measures the canvas's CSS size; `window.devicePixelRatio`
   is read again on every `resize` (browser zoom and moving to another
   monitor fire it).
2. `backingStoreSize(cssW, cssH, dpr)` = CSS size × DPR, rounded, at least 1x,
   capped at 4096 px per side (keeps the shape).
3. `fitCanvas()` sets that size and
   `ctx.setTransform(backingW / videoW, 0, 0, backingH / videoH, 0, 0)`.
   From then on the drawing code still draws in **video pixels**, so the
   centroid maths is untouched.
4. Clicks go the other way with `screenToLogical()`, which only uses
   `getBoundingClientRect()` (the size on screen) and the video size. The
   backing store never enters the click maths, so it is the same on every
   screen.
5. The hook returns `prepare()`; it changes whenever size or DPR change, so
   each overlay's draw effect (`useEffect(() => { const ctx = prepare(); ... }, [prepare, ...])`)
   redraws automatically.

**Where:**

- `TrajectoryCanvas` (Analyze and Job results) and `CrosshairOverlay`: drawn
  at DPR. Line widths and dot sizes are still computed from the video width,
  so they look the same size as before, only sharper. `drawCrosshair` and
  `drawCentroidDot` take an optional `frameWidth` for that (default: the
  canvas width, as before).
- **Raster canvases** (binarized frame, distance map, the sampler's frame)
  show *image data*: one canvas pixel per analysed pixel. Making them bigger
  would add no detail, and their exact pixels are what the tests and the
  sampler read. They keep their size and get `image-rendering: pixelated`, so
  each analysed pixel is a crisp square instead of a blur when stretched.
  Everything *vector* that used to be painted into them now sits on its own
  DPR overlay on top: the red centroid dot (`CentroidDotOverlay`, used by
  `AnalyzeViewer` and `BinarizedPreview`) and the sampler's squares and
  keyboard cursor (`sampler-markers`). The overlays have
  `pointer-events: none`, so clicks still reach the canvas below and still map
  with `clientToPixel`.
- `DistanceHistogram` is SVG, so already resolution-independent; the bars got
  `shape-rendering: crispEdges`, and the threshold line is now dashed so it
  doesn't rely on color alone.
- The crosshair now uses the existing `contrastingMarkerColor(targetColor)`
  (cyan for the dark-red salamander on the pink floor) instead of a fixed red
  that disappeared on that floor; its dark outline is unchanged. The
  trajectory keeps its cyan line + dot; the crosshair is a cross + ring, so the
  two differ by shape, not only color.
- A11y bits that live in these files: the view-mode panel titles are now
  `h2` headings (they were `h6` straight after the `h1`), the binarized canvas
  is `role="img"` with a description, the overlays are `aria-hidden` (the same
  information is in the text readouts), the sample-size buttons' names start
  with their visible text ("5×5 pixels"), and the "Samples" heading is an
  `h4` under its `h3` section.

**Tests:** `tests/player/hiDpi.test.ts` (8 unit tests: backing store size,
rounding, the 1x floor and the cap; a video pixel maps to the right backing
pixel; a click maps to the same video pixel at DPR 1, 2 and 3 and drawing at
it lands under the cursor; agreement with `clientToPixel`). Changed:
`TrajectoryCanvas.cy.tsx` reads pixels through the backing-store scale and
checks the backing store is CSS size × DPR; `jobs.cy.ts` checked the results
canvas was 1920 px wide, now it checks CSS width × DPR and the video's 16:9
shape; new `ColorSampler.cy.tsx` test: the frame canvas stays 20 px (exact
colors) while the marker canvas is 400 × DPR and draws the square in the
right place.

**Files:** `src/components/shared/hiDpi.ts`, `src/hooks/useHiDpiCanvas.ts`,
`src/components/player/CentroidDotOverlay.tsx`, `CrosshairOverlay.tsx`,
`drawing.ts`, `AnalyzeViewer.tsx`, `src/components/shared/TrajectoryCanvas.tsx`,
`src/hooks/useCentroidFrame.ts`, `src/components/BinarizedPreview.tsx`,
`src/components/color/ColorSampler.tsx`, `DistanceMap.tsx`,
`DistanceHistogram.tsx`, and the tests above.

**Checked:** tsc, lint, unit tests, build, Cypress component tests and E2E
tests on this commit.
