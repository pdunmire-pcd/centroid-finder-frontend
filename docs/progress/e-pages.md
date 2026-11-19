# Workstream E: Jobs, results pages and app shell

## Task 1: Theme and app shell — done

**What:** A new MUI theme with light and dark palettes (steel blue + burnt orange), 8 px radius, outlined cards, tabular numbers on the whole page and a shared monospace font for ids and hex values. A sticky top bar with a crosshair logo, Videos / Jobs tabs (the active tab follows the URL), a server status badge (Server online / Offline / Mock data, re-checked every 30 s) and a light/dark toggle saved in localStorage. A reusable `PageBreadcrumbs` component and a nicer 404 page.

**Files:** `src/theme.ts`, `src/main.tsx`, `src/App.tsx`, `src/components/layout/` (`AppThemeProvider.tsx`, `colorMode.ts`, `TopBar.tsx`, `nav.ts`, `ServerStatusBadge.tsx`, `LogoMark.tsx`, `PageBreadcrumbs.tsx`), `src/pages/NotFoundPage.tsx`.

**Tested:** tsc, lint, unit tests and build pass; the existing `processing.cy.ts` E2E still passes in mock mode. Screenshot: `screenshots/1-shell-dark.png`.

**Surprising:** MUI 9 removed "system props" such as `justifyContent` directly on `<Stack>`; they must go in `sx`. The `react-refresh` lint rule wants component files to export only components, so helpers (`activeTab`, the color-mode context) live in `.ts` files.

## Task 2: Videos page — done

**What:** The Videos page now loads `getVideoDetails()` and shows responsive cards (16:9 lazy-loaded thumbnail, filename, status chip Tracked / Processing / Error / Not processed, size and length when the server sends them). You can search by name and sort by name A–Z, Z–A or status. The first card, "Open from this computer", accepts a dropped or chosen video and navigates to `/analyze/local` with the `File` in router state; non-video files get an inline error. There is a loading spinner, an empty message, and an error state with "Try again" (the local-file card still works when the server is down). Clicking a card opens `/analyze/:filename`.

**Files:** `src/pages/VideoChooserPage.tsx`, `src/components/VideoList.tsx`, `src/components/videos/` (`VideoCard.tsx`, `VideoStatusChip.tsx`, `LocalFileCard.tsx`, `videoFilters.ts`), `tests/videos/videoFilters.test.ts`, `cypress/e2e/videos.cy.ts`.

**Tested:** 5 new Vitest tests for search/sort/`isVideoFile`; 5 Cypress E2E tests (cards, search, card click, local file → `/analyze/local`, non-video rejected) pass in mock mode. Screenshots: `screenshots/2-videos-light.png`, `screenshots/2-videos-phone.png`.

**Surprising:** the React Hooks v7 lint rule `set-state-in-effect` forbids calling `setLoading(true)` at the top of an effect, so "Try again" bumps a `reloadKey` counter that the effect depends on, and sets loading in the click handler instead.

## Task 3: Upload UI — done

**What:** An "Upload to server" button next to search/sort opens a file picker and calls `uploadVideo(file, onProgress, signal)`. While uploading, a small panel shows the file name, a determinate progress bar with the percentage, and a Cancel button that calls `abort()` on an `AbortController`. On success a green "Uploaded …" message appears and the video list is fetched again; on failure the server's error message is shown; a cancel shows "Upload cancelled" rather than an error.

**Files:** `src/components/videos/UploadPanel.tsx`, `src/pages/VideoChooserPage.tsx`, `cypress/e2e/videos.cy.ts`.

**Tested:** 2 new Cypress tests (upload with progress → success, cancel) pass in mock mode; tsc, lint, unit tests and build pass.

**Surprising:** after a cancel the request rejects like any error, so the code checks `controller.signal.aborted` to tell a cancel apart from a real failure. The baseline real-server `uploadVideo` only reports 0 and 1 (workstream D adds XHR progress), so the bar jumps on the real server until D's change lands.

## Task 4: Jobs page — done

**What:** `/jobs` shows every run from `getJobs()` in a compact table: short job id (monospace, full id on hover), video, target color swatch + hex, threshold, status chip (with the error message under failed jobs), started time as "5 min. ago" with the exact time in a tooltip, and a Results/Details link to `/jobs/:jobId`. Filter chips All / Processing / Done / Error show counts and use `aria-pressed`. Jobs are sorted newest first. While any job is processing the page re-fetches every 3 s; once none are processing the interval is cleared, so polling stops by itself.

**Files:** `src/pages/JobsPage.tsx`, `src/components/results/` (`format.ts`, `ColorSwatch.tsx`, `JobStatusChip.tsx`), `src/theme.ts` (`visuallyHiddenSx`), `src/App.tsx` (route), `tests/results/format.test.ts`, `cypress/e2e/jobs.cy.ts`.

**Tested:** 8 new Vitest tests (ids, hex, relative time, duration, filtering/sorting); 3 Cypress tests (list, filters, open results) pass in mock mode. Screenshot: `screenshots/4-jobs-light.png`.

**Surprising:** in MUI `sx`, `width: 1` means 100%, not 1 px, so the screen-reader-only style needs the string `'1px'`. On a phone the table scrolls sideways inside its card (min width 760 px) instead of squashing the columns.

## Task 5: Job results page — done

**What:** `/jobs/:jobId` has breadcrumbs (Jobs / id), a header with the video name, status chip and run settings (color swatch, threshold, start time, how long it took, job id), and a Started → Processing → Results ready stepper (a failed job shows a red "Failed" step with the server's message). While the job is processing the page fetches it again every 2 s. When it is done the CSV is loaded with `getTrack`, and the video plays with `TrajectoryCanvas` on top, sized to the video's natural `videoWidth × videoHeight`. Under the video a monospace readout shows time, frame number and x, y (or "no match"). "Download CSV" and "Run again with new settings" (`/analyze/:filename?color=<hex>&threshold=<n>`) buttons sit in the header.

**Files:** `src/pages/JobResultsPage.tsx`, `src/components/results/` (`ResultsPlayer.tsx`, `JobProgressSteps.tsx`, `useVideoTime.ts`, `trackData.ts`, `format.ts` → `runAgainUrl`), `src/App.tsx` (route), `tests/results/trackData.test.ts`, `cypress/e2e/jobs.cy.ts`.

**Tested:** 4 new Vitest tests for `pointIndexAt` (including a 12,000-row comparison with a linear search); 3 new Cypress tests (finished job, failed job, unknown job). The Cypress tests replace the 5-row mock CSV with a generated 275-row one via `cy.intercept`, because the mock file is tiny. Screenshot: `screenshots/5-results-player.png`.

**Surprising:** `timeupdate` only fires ~4 times a second, so `useVideoTime` also reads the time in a `requestAnimationFrame` loop while the video plays. The new hooks lint rule (`react-hooks/immutability`) refuses `video.currentTime = t` on an element kept in state, so seeking goes through a ref to the same element.

## Task 6: Summary tiles — done

**What:** Next to the video (below it on smaller screens) six tiles show the numbers from `summarizeTrack`: frames, % tracked, no-match frames, duration (s), distance travelled (px) and average speed (px/s). Each tile has a short hint saying where the number comes from. Numbers use thousands separators and tabular digits. The summary is calculated with `useMemo` only when a new CSV arrives, not on every video frame.

**Files:** `src/components/results/SummaryTiles.tsx`, `src/components/results/summary.ts`, `src/pages/JobResultsPage.tsx`, `src/theme.ts` (adds `chartSeriesColors` for Task 7), `tests/results/summary.test.ts`, `cypress/e2e/jobs.cy.ts`.

**Tested:** 2 new Vitest tests for the tile values and formatting; a new Cypress test checks there are 6 tiles, 275 frames and 15 no-match frames, and that every value is a number. Screenshot: `screenshots/6-results-summary-dark.png`.

**Surprising:** the tiles are a `<dl>` (description list) so screen readers read "Frames, 275"; the hint has to live inside the `<dd>`, because a `<dl>` may only contain terms and descriptions.
