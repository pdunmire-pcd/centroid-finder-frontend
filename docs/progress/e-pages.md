# Workstream E: Jobs, results pages and app shell

## Task 1: Theme and app shell — done

**What:** A new MUI theme with light and dark palettes (steel blue + burnt orange), 8 px radius, outlined cards, tabular numbers on the whole page and a shared monospace font for ids and hex values. A sticky top bar with a crosshair logo, Videos / Jobs tabs (the active tab follows the URL), a server status badge (Server online / Offline / Mock data, re-checked every 30 s) and a light/dark toggle saved in localStorage. A reusable `PageBreadcrumbs` component and a nicer 404 page.

**Files:** `src/theme.ts`, `src/main.tsx`, `src/App.tsx`, `src/components/layout/` (`AppThemeProvider.tsx`, `colorMode.ts`, `TopBar.tsx`, `nav.ts`, `ServerStatusBadge.tsx`, `LogoMark.tsx`, `PageBreadcrumbs.tsx`), `src/pages/NotFoundPage.tsx`.

**Tested:** tsc, lint, unit tests and build pass; the existing `processing.cy.ts` E2E still passes in mock mode. Screenshot: `screenshots/1-shell-dark.png`.

**Surprising:** MUI 9 removed "system props" such as `justifyContent` directly on `<Stack>`; they must go in `sx`. The `react-refresh` lint rule wants component files to export only components, so helpers (`activeTab`, the color-mode context) live in `.ts` files.
