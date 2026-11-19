import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parseTrackCsv } from '../../src/centroid/engine'

type Api = typeof import('../../src/api')

// USE_MOCK is read once when api.ts loads, so each test sets the env var and then
// loads a fresh copy of api.ts (and of the mock backend, so every test starts clean).
let api: Api

// The mock waits a little before answering (like a real network). Fake timers skip the wait.
async function run<T>(promise: Promise<T>): Promise<T> {
  // Mark it as handled now, so a rejection while the timers run isn't reported as
  // "unhandled". The caller still sees the rejection through the returned promise.
  promise.catch(() => {})
  await vi.runAllTimersAsync()
  return promise
}

beforeEach(async () => {
  vi.useFakeTimers()
  vi.stubEnv('VITE_USE_MOCK', 'true')
  vi.resetModules()
  api = await import('../../src/api')
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
})

describe('api.ts in mock mode', () => {
  it('is in mock mode and points at the files in public/mock', () => {
    expect(api.isMockMode()).toBe(true)
    expect(api.getVideoUrl('anything.mp4')).toBe('/mock/sample.mp4')
    expect(api.getThumbnailUrl('anything.mp4')).toBe('/mock/thumbnail.jpg')
  })

  it('starts with a processing, done and error job, newest first', async () => {
    const jobs = await run(api.getJobs())
    expect(jobs.map((job) => job.status)).toEqual(['processing', 'done', 'error', 'done'])
    const times = jobs.map((job) => job.startedAt)
    expect([...times].sort().reverse()).toEqual(times)
    expect(jobs[1]?.resultUrl).toBe('/mock/result.csv')
    expect(jobs[2]?.error).toBeTruthy()
  })

  it('gives each video the status of its newest job', async () => {
    const videos = await run(api.getVideoDetails())
    const statuses = Object.fromEntries(videos.map((video) => [video.filename, video.status]))
    expect(statuses).toEqual({
      'bright_balloon_sample_video.mp4': 'tracked',
      'salamander1.mp4': 'processing',
      'salamander2.mov': 'error',
      'forest_intro.mp4': 'not-processed',
    })
    expect(videos[0]).toMatchObject({ width: 1920, height: 1080, durationSeconds: 11 })
  })

  it('a new job is processing, then done after a few status checks, and the job list follows', async () => {
    const { jobId } = await run(api.processVideo('forest_intro.mp4', '#00FF00', 80))

    const first = await run(api.getJob(jobId))
    expect(first).toMatchObject({ filename: 'forest_intro.mp4', targetColor: '00ff00', threshold: 80, status: 'processing' })
    expect((await run(api.getJobs()))[0]?.jobId).toBe(jobId)

    const statuses: string[] = []
    for (let i = 0; i < 4; i++) statuses.push((await run(api.getProcessingStatus(jobId))).status)
    expect(statuses).toEqual(['processing', 'processing', 'processing', 'done'])

    const done = await run(api.getJob(jobId))
    expect(done.status).toBe('done')
    expect(done.resultUrl).toBe('/mock/result.csv')
    expect(done.finishedAt).toBeTruthy()

    const forest = (await run(api.getVideoDetails())).find((video) => video.filename === 'forest_intro.mp4')
    expect(forest?.status).toBe('tracked')
  })

  it('the error job keeps saying error', async () => {
    await expect(run(api.getProcessingStatus('mock-job-122'))).resolves.toMatchObject({ status: 'error' })
  })

  it('unknown jobs fail like a 404', async () => {
    await expect(run(api.getJob('nope'))).rejects.toThrow('Job ID not found')
  })

  it('an upload reports progress and appears in the video list', async () => {
    const fractions: number[] = []
    const file = new File(['x'], 'new_clip.mp4', { type: 'video/mp4' })
    const video = await run(api.uploadVideo(file, (f) => fractions.push(f)))

    expect(video).toMatchObject({ filename: 'new_clip.mp4', status: 'not-processed' })
    expect(fractions.at(-1)).toBe(1)
    expect(await run(api.getVideos())).toContain('new_clip.mp4')
  })

  it('refuses to upload a name that already exists, like the server (409)', async () => {
    const file = new File(['x'], 'salamander1.mp4', { type: 'video/mp4' })
    await expect(run(api.uploadVideo(file))).rejects.toThrow('already exists')
  })

  it('stops an upload when the signal is aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    const file = new File(['x'], 'other.mp4', { type: 'video/mp4' })
    await expect(run(api.uploadVideo(file, undefined, controller.signal))).rejects.toThrow('Upload cancelled')
  })

  it('getHealth says ok', async () => {
    await expect(api.getHealth()).resolves.toEqual({ ok: true, version: 'mock' })
  })
})

describe('public/mock/result.csv', () => {
  const text = readFileSync(new URL('../../public/mock/result.csv', import.meta.url), 'utf8')
  const points = parseTrackCsv(text)

  it('looks like real JAR output: no header, seconds,x,y on every line', () => {
    expect(text.startsWith('seconds')).toBe(false)
    for (const line of text.trim().split('\n')) expect(line).toMatch(/^\d+\.\d{3},-?\d+,-?\d+$/)
  })

  it('has one row per frame at 25 frames per second for the 11-second sample', () => {
    expect(points).toHaveLength(275)
    expect(points[1]!.seconds - points[0]!.seconds).toBeCloseTo(0.04, 5)
  })

  it('has a few frames with no match, and every other point inside the 1920x1080 frame', () => {
    const misses = points.filter((p) => p.x === -1 && p.y === -1)
    expect(misses.length).toBeGreaterThan(0)
    for (const p of points.filter((q) => q.x !== -1)) {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThan(1920)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThan(1080)
    }
  })
})
