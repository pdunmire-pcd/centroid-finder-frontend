// Web Worker that runs analyzeFrame off the main thread, so the page stays
// smooth while frames are analysed.
//
// Create it with (Vite bundles it automatically):
//   new Worker(new URL('./centroidWorker.ts', import.meta.url), { type: 'module' })
//
// Every message in is an AnalysisRequest, every message out an AnalysisResponse.
// The result's `binary` buffer is transferred (moved, not copied) to the page.

import { answerRequest, transferablesOf, type AnalysisRequest } from './analysisRequest'

// Our tsconfig only has the "DOM" types, where `self` is typed as a Window.
// Window has the same onmessage / postMessage(message, { transfer }) shape we
// use here, so no extra types are needed.
self.onmessage = (event: MessageEvent<AnalysisRequest>) => {
  const response = answerRequest(event.data)
  self.postMessage(response, { transfer: transferablesOf(response) })
}
