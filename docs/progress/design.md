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
