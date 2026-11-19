// Decides WHICH frames get analysed when frames arrive faster than we can
// analyse them. Only the newest frame matters for a live preview, so:
//
// - at most ONE frame is being analysed at a time
// - while busy, a new frame waits in a single "next" slot; if another frame
//   arrives first, it replaces the waiting one (the older one is skipped)
//
// It also measures how many frames per second actually get analysed.
// It knows nothing about React or Workers, so it is easy to test.

import type { FrameAnalysis } from '../centroid/engine'
import type { AnalysisRequest } from './analysisRequest'

/** Something that analyses one request, e.g. the worker or the main thread. */
export type AnalysisRunner = (request: AnalysisRequest) => Promise<FrameAnalysis>

/** A request without its id (the scheduler numbers requests itself). */
export type FrameJob = Omit<AnalysisRequest, 'id'>

export type SchedulerCallbacks = {
  onResult: (analysis: FrameAnalysis, fps: number) => void
  onError?: (message: string) => void
}

/** Counts events in the last second (a "sliding window"). */
export class FpsCounter {
  private times: number[] = []
  private readonly now: () => number

  constructor(now: () => number = () => performance.now()) {
    this.now = now
  }

  /** Records one analysed frame and returns the frames in the last second. */
  tick(): number {
    const time = this.now()
    this.times.push(time)
    // forget everything older than one second
    while (this.times.length > 0 && this.times[0] <= time - 1000) this.times.shift()
    return this.times.length
  }
}

export class LatestFrameScheduler {
  private readonly run: AnalysisRunner
  private readonly callbacks: SchedulerCallbacks
  private readonly fps: FpsCounter
  private nextId = 1
  private busy = false
  private waiting: FrameJob | null = null
  private stopped = false

  constructor(run: AnalysisRunner, callbacks: SchedulerCallbacks, fps = new FpsCounter()) {
    this.run = run
    this.callbacks = callbacks
    this.fps = fps
  }

  /** True while a frame is being analysed. */
  get isBusy(): boolean {
    return this.busy
  }

  /** Asks for a frame to be analysed. Returns at once; results come via onResult. */
  submit(job: FrameJob): void {
    if (this.stopped) {
      closeFrame(job)
      return
    }
    if (this.busy) {
      // replace the waiting frame: the older one is now out of date
      if (this.waiting) closeFrame(this.waiting)
      this.waiting = job
      return
    }
    this.start(job)
  }

  /** Stops for good: waiting frames are dropped, late results ignored. */
  stop(): void {
    this.stopped = true
    if (this.waiting) closeFrame(this.waiting)
    this.waiting = null
  }

  private start(job: FrameJob): void {
    this.busy = true
    const request: AnalysisRequest = { ...job, id: this.nextId++ }

    this.run(request)
      .then((analysis) => {
        if (!this.stopped) this.callbacks.onResult(analysis, this.fps.tick())
      })
      .catch((error: unknown) => {
        if (!this.stopped) {
          this.callbacks.onError?.(error instanceof Error ? error.message : String(error))
        }
      })
      .finally(() => {
        this.busy = false
        // if a newer frame arrived meanwhile, analyse it now
        const next = this.waiting
        this.waiting = null
        if (next && !this.stopped) this.start(next)
      })
  }
}

/** Frees an ImageBitmap we are not going to analyse. */
function closeFrame(job: FrameJob): void {
  if (typeof ImageBitmap !== 'undefined' && job.frame instanceof ImageBitmap) {
    job.frame.close()
  }
}
