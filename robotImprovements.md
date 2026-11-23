1. Fixing bugs and making things reliable (highest priority)
Processing gives up too easily. On the Analyze page, a single failed status check marks the job as failed, even if it's still running on the server. You saw this when the backend restarted. Focus on making polling tolerant of brief failures (retry a few times), and make sure one check finishes before the next one starts.
Frontend and backend can drift apart. Routes like /videos/, /thumbnail/, /frame and /process are hard-coded on both sides, and nothing checks they match. The /video vs /videos/ mismatch is an example. Keep a single list of the endpoints and their responses that both teams agree on, and add at least one test that runs against the real backend.
API responses are trusted blindly. api.ts tells TypeScript the server's response has the right shape without checking it. If the backend changes something, the app breaks somewhere unrelated. Validate responses where they come in.
2. Error handling
Errors are swallowed silently. About 15 catch blocks ignore the error completely, and the project has no logging at all. Some are justified, like blocked localStorage, but the ones in the analysis and canvas code hide real bugs. Decide on a consistent rule: every caught error is either handled, logged or shown to the user.
Every error is the same generic type. There are no specific error classes, so the code can't tell "server unreachable" apart from "video not found" or "user cancelled the upload". Introducing a few specific error types would let each one be handled properly. That's the TypeScript version of the "avoid catch(Exception e)" hint.
Messages are written for developers. Users see things like "Request failed with status 502". Turn common failures into plain guidance, like "Can't reach the server. Is the backend running?"
There's no safety net. If any component crashes while rendering, the whole page goes blank. Add an error boundary for each page.
3. Refactoring
Break up the largest files: engine.ts, AnalyzePage.tsx, VideoPlayer.tsx, JobResultsPage.tsx and theme.ts, each roughly 290–400 lines. Pull data fetching and polling into custom hooks, and split files that mix unrelated helpers.
Remove duplication: two ColorSwatch components, four separate hex-color converters, and a mock-mode if check repeated 14 times in api.ts. An API interface with real and mock versions would remove that repetition.
Delete dead code after checking with Paris: src/assets/mock/api.ts, BinarizedPreview.tsx, useFrameAnalysis.ts, the old exports in mock/jobs.ts, and getVideos().
4. Testing
Test failures, not just the happy path. The mock backend never fails, so nothing tests a server that's down, a restart mid-job, or a failed upload. That's where the real bugs have shown up.
Fill the gaps: a few hooks (useVideoTime, useCentroidFrame), the upload panel UI, the server status badge's offline state, and the player helpers have no tests.
Make testing easier to run: add a coverage tool to measure gaps, make the E2E suite start its own mock server, and run everything automatically on each push, e.g. with GitHub Actions.
Clean up outdated tests: tests that use the old /preview route or the unused BinarizedPreview, and one flaky test that only passes because of retries.
5. Performance
The app ships as one 1.1 MB JavaScript file (333 KB compressed), and the build warns about it. Every visitor downloads the results charts, color tools and player code even if they only open the video list. Load each page on demand, so the browser only downloads the code for the page being viewed.
15 font files ship, including Greek, Cyrillic and Vietnamese character sets. That's probably more than an English-only app needs. Trimming them to what you actually use would help.
The repo itself is heavy. The .git folder is 50 MB, mainly from videos and 87 design screenshots in docs/progress/. Keep big binary files out of the repo going forward, e.g. with .gitignore or Git LFS, and use a short clip for mock mode instead of a full 33 MB video.
The live analysis already performs well (Web Worker, frame skipping, downscaling). That's a strength worth keeping and documenting.
6. Security
Dependencies are in good shape: npm audit reports 0 vulnerabilities. A few packages have minor updates available, like react-router-dom and recharts. Run audits regularly, ideally automatically.
Validate inputs before sending them. Check uploads for file type and size in the UI before they're sent, not only in the mock backend. Check filenames from the URL against the real video list. The backend must still do its own checks, because the frontend can be bypassed.
Treat stored data as untrusted. Saved color profiles are read back from localStorage with JSON.parse. Make sure bad or tampered data is rejected cleanly rather than crashing the app. The code partly does this already, so make it consistent.
What's already safe: no innerHTML or eval, filenames are URL-encoded, and the CSV link uses rel="noreferrer". Keep those habits.
7. Documentation
The README is out of date. It describes the deleted /preview page and PreviewPage.tsx, says 36 unit tests (now 307) and 6 component tests (now 75), and doesn't mention the Jobs, Results or Analyze pages. This is the quickest win.
Add Architecture and Troubleshooting sections. Show how a video flows through the app, and list the problems you actually hit: backend not running, tsx watch restarts, videos missing from the list, colors not matching.
Document the contracts: the endpoints in api.ts, how the mock backend behaves, and what threshold and x = y = -1 mean in engine.ts. About 16% of exported functions (31 of 193) have no comment. Use /** */ JSDoc so the docs show up in VS Code.