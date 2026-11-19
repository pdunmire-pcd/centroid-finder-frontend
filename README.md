# Centroid Finder Frontend

React + TypeScript + Material UI frontend for the Centroid Finder Express server.

The app lets a user choose a video, preview its first frame, tune target-color and threshold settings, run centroid processing, poll the job status, and download the generated CSV.

## Features

- Video chooser at `/videos` with loading and error states
- Routed preview at `/preview/:filename`
- Live binarized canvas with the largest centroid marked
- Target-color picker and 0–442 threshold slider
- Background processing job submission and status polling
- Processing, error, and CSV-download states
- Mock API mode for frontend development and Cypress tests
- Cypress E2E and component tests
- 36 Vitest unit tests for the Java-matching centroid algorithms

## Setup

```bash
npm install
```

## Running

### Mock mode

Mock mode does not require the Express server or JAR:

```bash
npm run dev:mock
```

### Real backend

Start the Centroid Finder Express server on port `3000`, then run:

```bash
npm run dev
```

Open `http://localhost:5173`.

Vite proxies `/api`, `/thumbnail`, `/process`, and `/results` to `http://localhost:3000`. The proxy is configured in `vite.config.ts`.

## Processing flow

1. Choose a video from `/videos`.
2. Open `/preview/:filename`.
3. Adjust the target color and threshold.
4. Select **Process Video with These Settings**.
5. The frontend calls `POST /process/:filename` with `targetColor` and `threshold` query parameters.
6. It polls `GET /process/:jobId/status` every two seconds.
7. On success, the UI provides a link to the generated CSV.

The server's complete Euclidean color-distance threshold range is `0–442`. The slider intentionally uses `442` so every possible color distance is selectable.

## Testing

Run the build and lint checks:

```bash
npm run build
npm run lint
```

Run the 36 unit tests:

```bash
npm test
```

Run the 6 Cypress component tests:

```bash
npm run test:component
```

For Cypress E2E tests, keep the mock server running in one terminal:

```bash
npm run dev:mock
```

Then run the E2E suite in another terminal:

```bash
npm run e2e
```

If VS Code reports `bad option: --no-sandbox` while running Electron/Cypress, unset the environment override first:

```bash
unset ELECTRON_RUN_AS_NODE
npm run test:component
```

## Project layout

| Path | What it is |
| --- | --- |
| `src/api.ts` | Backend and mock API functions |
| `src/mock/` | Mock API responses |
| `public/mock/` | Mock thumbnail and CSV files |
| `src/hoc/withLoading.tsx` | Loading/error wrapper for data components |
| `src/pages/VideoChooserPage.tsx` | `/videos` video chooser |
| `src/pages/PreviewPage.tsx` | `/preview/:filename` preview and processing page |
| `src/components/ProcessingControls.tsx` | Threshold, color, process button, and status controls |
| `src/components/BinarizedPreview.tsx` | Live binarized canvas and largest-centroid dot |
| `src/centroid/` | TypeScript ports of the Java centroid algorithm |
| `tests/centroid/` | Vitest unit and Java-equivalence tests |
| `cypress/component/` | Cypress component tests for the canvas |
| `cypress/e2e/` | Cypress end-to-end tests |

## Screenshots

Add final screenshots here after visual review:

- Video chooser
- Preview page
- Live binarized canvas
- Successful processing and CSV download
- Processing error state
