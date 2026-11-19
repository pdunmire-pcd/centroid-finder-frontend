import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getFrameUrl,
  getHealth,
  getJob,
  getJobs,
  getProcessingStatus,
  getTrack,
  getVideoDetails,
  getVideos,
  getVideoUrl,
  isMockMode,
  processVideo,
} from '../../src/api'

// Real-server mode (VITE_USE_MOCK isn't set in tests): fetch is replaced by a fake
// that answers with whatever the test sets up, and remembers what it was asked.
const fetchMock = vi.fn<typeof fetch>()

function answer(status: number, body: unknown) {
  const text = typeof body === 'string' ? body : JSON.stringify(body)
  fetchMock.mockResolvedValueOnce(new Response(text, { status }))
}

function calledUrl(): string {
  return String(fetchMock.mock.calls[0]?.[0])
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('api.ts with the real server', () => {
  it('is not in mock mode', () => {
    expect(isMockMode()).toBe(false)
  })

  it('getVideos calls GET /api/videos', async () => {
    answer(200, ['a.mp4'])
    await expect(getVideos()).resolves.toEqual(['a.mp4'])
    expect(calledUrl()).toBe('/api/videos')
  })

  it('getVideoDetails calls GET /api/videos/details', async () => {
    const videos = [{ filename: 'a.mp4', status: 'tracked', width: 1920, height: 1080, durationSeconds: 11 }]
    answer(200, videos)
    await expect(getVideoDetails()).resolves.toEqual(videos)
    expect(calledUrl()).toBe('/api/videos/details')
  })

  it('getJobs and getJob call /api/jobs and encode the id', async () => {
    answer(200, [])
    await getJobs()
    expect(calledUrl()).toBe('/api/jobs')

    fetchMock.mockReset()
    answer(200, { jobId: 'a/b' })
    await getJob('a/b')
    expect(calledUrl()).toBe('/api/jobs/a%2Fb')
  })

  it("getJob throws the server's error message on 404", async () => {
    answer(404, { error: 'Job ID not found' })
    await expect(getJob('nope')).rejects.toThrow('Job ID not found')
  })

  it('falls back to the status code when the error body is not JSON', async () => {
    answer(502, 'Bad gateway')
    await expect(getJobs()).rejects.toThrow('Request failed with status 502')
  })

  it('getHealth calls GET /api/health', async () => {
    answer(200, { ok: true, version: '1.0.0' })
    await expect(getHealth()).resolves.toEqual({ ok: true, version: '1.0.0' })
    expect(calledUrl()).toBe('/api/health')
  })

  it('processVideo POSTs without the # in the color', async () => {
    answer(202, { jobId: 'job-1' })
    await expect(processVideo('my video.mp4', '#FF4500', 100)).resolves.toEqual({ jobId: 'job-1' })
    expect(calledUrl()).toBe('/process/my%20video.mp4?targetColor=FF4500&threshold=100')
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('POST')
  })

  it('getProcessingStatus calls the status route', async () => {
    answer(200, { status: 'done', result: '/results/job-1.csv' })
    await expect(getProcessingStatus('job-1')).resolves.toEqual({ status: 'done', result: '/results/job-1.csv' })
    expect(calledUrl()).toBe('/process/job-1/status')
  })

  it('getTrack downloads and parses a JAR CSV', async () => {
    answer(200, '0.000,1080,581\n0.040,-1,-1\n')
    await expect(getTrack('/results/job-1.csv')).resolves.toEqual([
      { seconds: 0, x: 1080, y: 581 },
      { seconds: 0.04, x: -1, y: -1 },
    ])
  })

  it('getTrack throws when the CSV is missing', async () => {
    answer(404, 'Not found')
    await expect(getTrack('/results/nope.csv')).rejects.toThrow('status 404')
  })

  it('builds encoded video and frame URLs', () => {
    expect(getVideoUrl('my video.mp4')).toBe('/videos/my%20video.mp4')
    expect(getFrameUrl('my video.mp4', 2.5)).toBe('/frame/my%20video.mp4?t=2.5')
  })
})
