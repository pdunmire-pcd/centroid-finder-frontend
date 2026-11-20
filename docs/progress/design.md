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
