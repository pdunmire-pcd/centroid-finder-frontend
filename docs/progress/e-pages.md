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
