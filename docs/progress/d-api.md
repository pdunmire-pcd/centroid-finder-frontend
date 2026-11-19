# Workstream D: Backend and API layer — progress

Backend work lives in the worktree `centroid-finder-upgrade-api` (branch `upgrade/api`, uncommitted on purpose: the students review and commit it). Frontend work is on `upgrade/d-api`.

## Task 1: listJobs() on the job store — done
Added `listJobs()` (every job, newest first) to the `JobStore` interface, `FakeJobStore` and `NeonJobStore` (`ORDER BY created_at DESC`). `Job` now has `createdAt: Date`, read from the existing `created_at` column, so no schema change was needed and no existing endpoint changed.
- Files (backend): `server/src/jobStore.ts`, `fakeJobStore.ts`, `neonJobStore.ts`, `jobStore.test.ts`, new `neonJobStore.test.ts`.
- Tested: 3 new FakeJobStore tests + 3 NeonJobStore tests with a fake pg Pool (36 total at this point).
- Surprise: the existing "starts a new job" test compares the whole object, so it now expects `createdAt: expect.any(Date)`.

## Task 2: GET /api/jobs and GET /api/jobs/:id — done
A new `jobsRoute.ts` turns each `Job` into the frontend's `JobRecord` (`startedAt` = created_at as ISO, `resultUrl` only when done, `error` only when failed). `result` already holds the public `/results/<id>.csv` URL, the same value the status route sends. Unknown ids → 404 `{ error: "Job ID not found" }`.
- Files (backend): new `server/src/jobsRoute.ts`, `jobsRoute.test.ts`; `app.ts`.
- Tested: 6 supertest tests (order, shape, empty list, 404, 500 x2).
- Surprise: `finishedAt` is never sent, because the table has no finished time (see the optional migration in the final report).

## Task 3: GET /api/videos/details — done
Lists the videos folder like `/api/videos`, then gives each video the status of its newest job (done → tracked, processing, error, none → not-processed). ffprobe (execFile, no shell) adds `durationSeconds`, `width`, `height`; if it can't read a file those fields are just left out. `/api/videos` still returns `string[]`.
- Files (backend): new `server/src/videoInfo.ts`, `videoDetailsRoute.ts`, `videoDetailsRoute.test.ts`; `app.ts` (reuses `isVideoFile`).
- Tested: 7 tests, including the real sample video (1920×1080, ~11 s) and a check that `/api/videos` is unchanged.

## Task 4: GET /frame/:filename?t= — done
Same style as `/thumbnail`, but runs `ffmpeg -ss <t> -i <video> -frames:v 1 -c:v png pipe:1` and sends a PNG. `t` must be a number ≥ 0 (else 400), a `t` past the end gives 404, a missing video 500; `path.basename` keeps it in the videos folder.
- Files (backend): new `server/src/frameRoute.ts`, `frameRoute.test.ts`.
- Tested: 8 tests with real ffmpeg (PNG signature, different times give different images, 400/404/500, `../` blocked).
- Surprise: ffmpeg exits with code 0 and prints nothing when `t` is after the end, so the route checks for empty output.

## Task 5: POST /api/videos upload — done
Uses `multer` (new dependency) to stream the file in field `video` straight to disk, with `MAX_UPLOAD_BYTES` = 2 GB. `fileFilter` refuses bad names (400), non-.mp4/.mov or the wrong mimetype (415) and names already taken (409) before anything is written. The file is written as `name.<uuid>.part` and then `fs.link`ed to its real name (which fails if the name got taken in the meantime), so half-uploaded files never appear in the video list.
- Files (backend): new `server/src/uploadRoute.ts`, `uploadRoute.test.ts`; `app.ts` (optional `maxUploadBytes` for tests); `package.json` / `package-lock.json` (`multer`, `@types/multer`).
- Tested: 12 tests (safeFilename, 201 with a real upload, 409, 415 x2, 413 with a 10-byte limit, 400 x2, `../` names).
- Surprise: `multer.diskStorage({ destination: "<folder>" })` tries to create the folder when the app starts, which broke every test that uses a fake `/videos` folder. A destination function avoids that.

## Task 6: GET /api/health — done
Returns `{ ok: true, version }`, with the version read once from `server/package.json` (works from both `src/` and `dist/`).
- Files (backend): new `server/src/healthRoute.ts`, `healthRoute.test.ts`.
- Tested: 1 test.

## Task 7: backend checks and serverPlan.md — done
`npm test` in `server/`: 12 files, 70 tests passing (was 30). `npx tsc --noEmit`: clean. Added an "Extra endpoints for the frontend's UI upgrade" section (table + how each works) to `serverPlan.md`.
- Files (backend): `serverPlan.md`.

## Task 8: real upload progress — done
`uploadVideo` now sends the form with `XMLHttpRequest`, because `fetch` can't report how much of a request body has been sent. `upload.onprogress` drives `onProgress(fraction)`, the `AbortSignal` calls `xhr.abort()`, and errors use the server's `{ error }` message like `fetchJson` (both now share one `errorMessage` helper).
- Files (frontend): `src/api.ts`, new `tests/api/upload.test.ts`.
- Tested: 6 new Vitest tests with a fake XHR (progress, JSON and non-JSON errors, abort before/during, network error).

## Task 9: Vite proxy for /frame and /videos/<file> — done
Added `/frame` and a regex key `^/videos/.+` that only matches when a file name follows `/videos/`, so the `/videos` chooser page stays a React page. Its `bypass` (`sendPagesToReact`) answers browser page loads (`Accept: text/html`) with `index.html`, so only file requests (a `<video>` tag, fetch) reach Express. The backend address can now be changed with `BACKEND_URL` (default `http://localhost:3000`).
- Files (frontend): `vite.config.ts`, new `tests/api/viteProxy.test.ts`.
- Tested: 3 Vitest tests on the proxy rules and the bypass. By hand: ran Vite against a stub server and checked with curl that `/videos` and `/videos/a.mp4` as a page give index.html, `/videos/a.mp4` as a video reaches the backend with its `Range` header, and `/frame` and `/api` are proxied.

## Task 10: richer mocks and a real per-frame mock CSV — done
Mock mode now has a small in-memory "pretend server" (`src/mock/backend.ts`) that follows the real server's rules: it starts with one processing, two done and one error job; `processVideo` adds a new processing job and `getProcessingStatus` turns it done after 3 checks, which `getJobs`, `getJob` and `getVideoDetails` (status from the newest job, plus the sample's 1920×1080, 11 s) all see. Mock uploads appear in `getVideos` and refuse duplicate names like the server's 409. `public/mock/result.csv` is now real `videoprocessor.jar` output for `public/mock/sample.mp4` (FF4500, threshold 100): 275 rows, no header, 25 rows per second, with 6 natural `-1,-1` gaps.
- Files (frontend): `src/api.ts`, `src/mock/jobs.ts`, `src/mock/videos.ts`, new `src/mock/backend.ts`, `public/mock/result.csv`.
- Tested: the existing Cypress E2E `processing.cy.ts` passes unchanged against `vite --mode mock` (1/1). Unit tests for the mock come in Task 11.
- Surprise: the sample video is 1920×1080, not 1280×720, so the real JAR run was the easiest way to get a realistic path. Also, Cypress only starts here with `ELECTRON_RUN_AS_NODE` unset (the editor's terminal sets it).

## Task 11: tests for api.ts — done
Two new Vitest files: `api.fetch.test.ts` replaces `fetch` with a fake and checks every endpoint's URL, method, encoding and error messages; `api.mock.test.ts` turns mock mode on (`vi.stubEnv` + a fresh import) and walks through the mock's behavior: job list, video statuses, a job going processing → done, uploads and 409s, abort. It also checks `public/mock/result.csv` really looks like JAR output. A new Cypress spec `cypress/e2e/api.cy.ts` (mock mode) checks the `/videos` page still renders, the proxy bypass answers page loads with index.html, the mock CSV format, and Range requests on the mock video.
- Files (frontend): new `tests/api/api.fetch.test.ts`, `tests/api/api.mock.test.ts`, `cypress/e2e/api.cy.ts`.
- Tested: Vitest 70 passing (34 in `tests/api/`, was 36 total before this workstream); Cypress E2E 5/5 and component 6/6.
- Surprise: with fake timers a rejected mock promise is reported as "unhandled" before the test awaits it, so the `run()` helper marks it handled first.

## Task 12: README — done
Updated the proxy sentence (new `/frame` and `/videos/<file>` rules, `BACKEND_URL`) and added one short paragraph under "Processing flow" listing the extra endpoints. Kept to 2 lines changed/added so it merges easily with the uncommitted README edits on main; the "Run the 36 unit tests" count is left alone for the same reason (it is now 70).
- Files (frontend): `README.md`.
- Tested: also ran an end-to-end smoke check: the real Express app (backend worktree, FakeJobStore) behind `vite` with `BACKEND_URL`, and curl through the proxy for health, videos, details (1920×1080, 11.0 s), jobs, 404, frame PNG, 400 bad t, Range 206, upload 201 then 409.
