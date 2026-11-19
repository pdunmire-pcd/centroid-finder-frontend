import { describe, expect, it } from 'vitest'
import type { FrameAnalysis } from '../../src/centroid/engine'
import { analyzeFrame } from '../../src/centroid/engine'
import {
  answerRequest,
  transferablesOf,
  type AnalysisRequest,
} from '../../src/workers/analysisRequest'
import { FpsCounter, LatestFrameScheduler } from '../../src/workers/frameScheduler'
import { createBestRunner, createMainThreadRunner } from '../../src/workers/runners'
import { solidImage } from './helpers'

const request = (id: number): AnalysisRequest => ({
  id,
  frame: solidImage(4, 4, 0x00ff00),
  color: 0x00ff00,
  threshold: 10,
  scale: 1,
})

describe('answerRequest (what the worker does with a message)', () => {
  it('answers with the same result as analyzeFrame and the same id', () => {
    const response = answerRequest(request(7))
    expect(response.id).toBe(7)
    expect(response.analysis).toEqual(analyzeFrame(solidImage(4, 4, 0x00ff00), 0x00ff00, 10))
  })

  it('turns a thrown error into an error message', () => {
    const broken = {
      width: 2,
      height: 2,
      get data(): Uint8Array { throw new Error('no pixels') },
    }
    const response = answerRequest({ ...request(3), frame: broken })
    expect(response).toEqual({ id: 3, error: 'no pixels' })
  })

  it('lists the binary buffer as transferable', () => {
    const response = answerRequest(request(1))
    expect(transferablesOf(response)).toEqual([response.analysis?.binary.buffer])
    expect(transferablesOf({ id: 1, error: 'x' })).toEqual([])
  })
})

describe('runners', () => {
  it('falls back to the main thread when Worker is not available (Node)', () => {
    expect(typeof Worker).toBe('undefined')
    expect(createBestRunner().usingWorker).toBe(false)
  })

  it('main thread runner resolves with the analysis', async () => {
    const analysis = await createMainThreadRunner().run(request(1))
    expect(analysis.matchingPixels).toBe(16)
  })
})

describe('FpsCounter', () => {
  it('counts the events in the last second', () => {
    let time = 0
    const counter = new FpsCounter(() => time)
    for (let k = 0; k < 30; k++) {
      time = k * 40 // 25 per second
      counter.tick()
    }
    time = 1200
    // events at 240..1160 ms are within the last second, plus this one
    expect(counter.tick()).toBe(25)
  })
})

/** A runner we can finish by hand, to test the scheduler step by step. */
function manualRunner() {
  const started: AnalysisRequest[] = []
  const finishers: Array<(a: FrameAnalysis) => void> = []
  const failers: Array<(e: Error) => void> = []
  const run = (req: AnalysisRequest) =>
    new Promise<FrameAnalysis>((resolve, reject) => {
      started.push(req)
      finishers.push(resolve)
      failers.push(reject)
    })
  return { run, started, finishers, failers }
}

const job = (threshold: number) => ({
  frame: solidImage(1, 1, 0),
  color: 0,
  threshold,
  scale: 1,
})

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))
const fakeAnalysis = analyzeFrame(solidImage(1, 1, 0), 0, 1)

describe('LatestFrameScheduler', () => {
  it('analyses one frame at a time and skips frames that went stale', async () => {
    const runner = manualRunner()
    const results: number[] = []
    const scheduler = new LatestFrameScheduler(runner.run, {
      onResult: () => results.push(results.length),
    })

    scheduler.submit(job(1)) // starts at once
    scheduler.submit(job(2)) // waits
    scheduler.submit(job(3)) // replaces 2
    expect(runner.started.map((r) => r.threshold)).toEqual([1])
    expect(scheduler.isBusy).toBe(true)

    runner.finishers[0](fakeAnalysis)
    await flush()
    // frame 2 was skipped, frame 3 started
    expect(runner.started.map((r) => r.threshold)).toEqual([1, 3])

    runner.finishers[1](fakeAnalysis)
    await flush()
    expect(results).toHaveLength(2)
    expect(scheduler.isBusy).toBe(false)
  })

  it('gives every request a new, increasing id', async () => {
    const runner = manualRunner()
    const scheduler = new LatestFrameScheduler(runner.run, { onResult: () => {} })
    scheduler.submit(job(1))
    runner.finishers[0](fakeAnalysis)
    await flush()
    scheduler.submit(job(2))
    expect(runner.started.map((r) => r.id)).toEqual([1, 2])
  })

  it('reports errors and keeps going', async () => {
    const runner = manualRunner()
    const errors: string[] = []
    const scheduler = new LatestFrameScheduler(runner.run, {
      onResult: () => {},
      onError: (message) => errors.push(message),
    })
    scheduler.submit(job(1))
    scheduler.submit(job(2))
    runner.failers[0](new Error('boom'))
    await flush()
    expect(errors).toEqual(['boom'])
    expect(runner.started).toHaveLength(2)
  })

  it('ignores results that arrive after stop()', async () => {
    const runner = manualRunner()
    let results = 0
    const scheduler = new LatestFrameScheduler(runner.run, { onResult: () => results++ })
    scheduler.submit(job(1))
    scheduler.submit(job(2))
    scheduler.stop()
    runner.finishers[0](fakeAnalysis)
    await flush()
    expect(results).toBe(0)
    expect(runner.started).toHaveLength(1) // the waiting frame was dropped
  })
})
