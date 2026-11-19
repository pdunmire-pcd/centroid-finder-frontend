// React hook for analysing live video frames in a Web Worker.
//
//   const { analyze, analysis, fps, error } = useFrameAnalysis()
//   // e.g. in a requestAnimationFrame loop:
//   analyze(await createImageBitmap(video), color, threshold, 0.5)
//
// - Frames are analysed one at a time. If frames come in faster than they can
//   be analysed, the in-between ones are skipped: only the newest one waits.
// - `fps` is how many frames per second were actually analysed.
// - Without Worker support (e.g. tests) it runs on the main thread instead.
// - An ImageBitmap passed to analyze() is given away (moved to the worker or
//   closed), so do not use it afterwards. ImageData is copied and stays usable.

import { useCallback, useEffect, useRef, useState } from 'react'
import type { FrameAnalysis } from '../centroid/engine'
import type { AnalysisFrame } from '../workers/analysisRequest'
import { LatestFrameScheduler } from '../workers/frameScheduler'
import { createBestRunner, type DisposableRunner } from '../workers/runners'

export type FrameAnalysisState = {
  /** latest finished analysis, or null before the first one */
  analysis: FrameAnalysis | null
  /** frames analysed in the last second */
  fps: number
  /** message of the last failure, cleared by the next success */
  error: string | null
}

export type UseFrameAnalysis = FrameAnalysisState & {
  /** queue a frame; `scale` defaults to 1 (exact) */
  analyze: (frame: AnalysisFrame, color: number, threshold: number, scale?: number) => void
  /** false when running on the main thread fallback */
  usingWorker: boolean
}

export function useFrameAnalysis(): UseFrameAnalysis {
  const [state, setState] = useState<FrameAnalysisState>({ analysis: null, fps: 0, error: null })
  const [usingWorker, setUsingWorker] = useState(false)

  // The worker and scheduler live in refs: they are not shown on screen, and
  // changing them must not re-render the component.
  const runnerRef = useRef<DisposableRunner | null>(null)
  const schedulerRef = useRef<LatestFrameScheduler | null>(null)

  // Created on the first analyze() call (not during render), so a component
  // that never analyses never starts a worker.
  const getScheduler = useCallback((): LatestFrameScheduler => {
    if (!schedulerRef.current) {
      const runner = createBestRunner()
      runnerRef.current = runner
      setUsingWorker(runner.usingWorker)
      schedulerRef.current = new LatestFrameScheduler(runner.run, {
        onResult: (analysis, fps) => setState({ analysis, fps, error: null }),
        onError: (message) => setState((old) => ({ ...old, error: message })),
      })
    }
    return schedulerRef.current
  }, [])

  // When the component goes away, stop the scheduler and the worker.
  useEffect(() => {
    return () => {
      schedulerRef.current?.stop()
      runnerRef.current?.dispose()
      schedulerRef.current = null
      runnerRef.current = null
    }
  }, [])

  const analyze = useCallback(
    (frame: AnalysisFrame, color: number, threshold: number, scale = 1) => {
      getScheduler().submit({ frame, color, threshold, scale })
    },
    [getScheduler],
  )

  return { ...state, analyze, usingWorker }
}
