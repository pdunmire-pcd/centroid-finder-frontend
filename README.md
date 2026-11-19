# Centroid Finder Frontend

React + TypeScript + Material UI frontend for our centroid finder Express server.

## Setup

```bash
npm install
```

## Running

**With mock data (no backend needed):**

```bash
npm run dev:mock
```

**With the real backend:** start the Express server first (port 3000, from the server repo: `cd server && npm run dev`), then:

```bash
npm run dev
```

Open http://localhost:5173. Vite proxies `/api`, `/thumbnail`, `/process` and `/results` to `http://localhost:3000` (see `vite.config.ts`).

## Project layout

| Path | What it is |
| --- | --- |
| `src/api.ts` | One function per backend endpoint (switches to mock data in `dev:mock`) |
| `src/mock/` | Mock API responses; `public/mock/` holds the mock thumbnail and CSV |
| `src/hoc/withLoading.tsx` | Higher-order component: spinner while loading, error alert on failure |
| `src/pages/VideoChooserPage.tsx` | `/videos`: list of videos as clickable cards |
| `src/pages/PreviewPage.tsx` | `/preview/:filename`: thumbnail, binarized preview and processing |
