// Two ways to run an analysis: in the Web Worker, or on the main thread.
// Both return a Promise, so the scheduler can use either one.

import type { FrameAnalysis } from '../centroid/engine'
import { answerRequest, type AnalysisRequest, type AnalysisResponse } from './analysisRequest'
import type { AnalysisRunner } from './frameScheduler'

/** A runner plus a way to shut it down. */
export type DisposableRunner = {
  run: AnalysisRunner
  dispose: () => void
  usingWorker: boolean
}

/** Runs analyzeFrame directly (used when Workers are not available, e.g. in tests). */
export function createMainThreadRunner(): DisposableRunner {
  return {
    run: (request) => {
      const response = answerRequest(request)
      return response.analysis
        ? Promise.resolve(response.analysis)
        : Promise.reject(new Error(response.error))
    },
    dispose: () => {},
    usingWorker: false,
  }
}

/** Runs analyses in centroidWorker.ts. */
export function createWorkerRunner(): DisposableRunner {
  const worker = new Worker(new URL('./centroidWorker.ts', import.meta.url), { type: 'module' })

  // Promises waiting for an answer, by request id.
  type Pending = { resolve: (a: FrameAnalysis) => void; reject: (e: Error) => void }
  const pending = new Map<number, Pending>()

  worker.onmessage = (event: MessageEvent<AnalysisResponse>) => {
    const response = event.data
    const waiter = pending.get(response.id)
    if (!waiter) return
    pending.delete(response.id)
    if (response.analysis) waiter.resolve(response.analysis)
    else waiter.reject(new Error(response.error))
  }

  // e.g. the worker script failed to load: fail everything that is waiting
  worker.onerror = (event) => {
    for (const waiter of pending.values()) {
      waiter.reject(new Error(event.message || 'Centroid worker failed'))
    }
    pending.clear()
  }

  return {
    run: (request: AnalysisRequest) =>
      new Promise<FrameAnalysis>((resolve, reject) => {
        pending.set(request.id, { resolve, reject })
        // ImageBitmaps are moved to the worker (instant). ImageData is copied,
        // so the caller can keep using it.
        const transfer =
          typeof ImageBitmap !== 'undefined' && request.frame instanceof ImageBitmap
            ? [request.frame]
            : []
        worker.postMessage(request, transfer)
      }),
    dispose: () => {
      worker.terminate()
      pending.clear()
    },
    usingWorker: true,
  }
}

/** The worker when the browser has Workers, otherwise the main thread. */
export function createBestRunner(): DisposableRunner {
  if (typeof Worker === 'undefined') return createMainThreadRunner()
  try {
    return createWorkerRunner()
  } catch {
    return createMainThreadRunner()
  }
}
