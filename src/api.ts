// One function per backend endpoint. Components call these instead of fetch() directly,
// so the URLs live in one place and we can swap in mock data with one switch.

import { mockVideoList, mockThumbnailUrl } from './mock/videos'
import type { JobRecord, TrackPoint, VideoInfo } from './types'
import { parseTrackCsv } from './centroid/engine'
import { MOCK_CHECKS_BEFORE_DONE, mockDone, mockProcessing, mockStartJob } from './mock/jobs'

// `npm run dev:mock` loads .env.mock, which sets this to "true"
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// ---- Response types (same shapes our Express server sends) ----

export type ProcessResponse = { jobId: string }

export type ProcessingStatus =
  | { status: 'processing' }
  | { status: 'done'; result: string }
  | { status: 'error'; error: string }

// ---- Helpers ----

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(errorMessage(res.status, await res.text()))
  return res.json() as Promise<T>
}

// ---- Endpoints ----

// GET /api/videos
export async function getVideos(): Promise<string[]> {
  if (USE_MOCK) {
    await delay(500)
    return mockVideoList
  }
  return fetchJson<string[]>('/api/videos')
}

// GET /thumbnail/:filename
export function getThumbnailUrl(filename: string): string {
  if (USE_MOCK) return mockThumbnailUrl
  return `/thumbnail/${encodeURIComponent(filename)}`
}

// POST /process/:filename?targetColor=<hex>&threshold=<int>
export async function processVideo(
  filename: string,
  targetColor: string,
  threshold: number,
): Promise<ProcessResponse> {
  const color = targetColor.replace('#', '')
  if (USE_MOCK) {
    await delay(300)
    mockStatusChecks = 0
    return mockStartJob
  }
  const params = new URLSearchParams({ targetColor: color, threshold: String(threshold) })
  return fetchJson<ProcessResponse>(`/process/${encodeURIComponent(filename)}?${params}`, {
    method: 'POST',
  })
}

// GET /process/:jobId/status
let mockStatusChecks = 0
export async function getProcessingStatus(jobId: string): Promise<ProcessingStatus> {
  if (USE_MOCK) {
    await delay(200)
    mockStatusChecks++
    return mockStatusChecks > MOCK_CHECKS_BEFORE_DONE ? mockDone : mockProcessing
  }
  return fetchJson<ProcessingStatus>(`/process/${encodeURIComponent(jobId)}/status`)
}

// ---- UI upgrade endpoints (shared contract) ----
// BASELINE VERSION: simple but working. Workstream D owns these and the server
// routes behind them; other workstreams only call them, never change the
// signatures.

// GET /api/videos/details -> VideoInfo[] (new; /api/videos stays a string[])
export async function getVideoDetails(): Promise<VideoInfo[]> {
  if (USE_MOCK) {
    await delay(300)
    return mockVideoList.map((filename, i) => ({
      filename,
      status: i === 0 ? 'tracked' : 'not-processed',
    }))
  }
  return fetchJson<VideoInfo[]>('/api/videos/details')
}

// GET /videos/:filename -> the video file itself (Range requests work)
export function getVideoUrl(filename: string): string {
  if (USE_MOCK) return '/mock/sample.mp4'
  return `/videos/${encodeURIComponent(filename)}`
}

// GET /frame/:filename?t=<seconds> -> PNG decoded the same way the JAR reads it
export function getFrameUrl(filename: string, seconds: number): string {
  if (USE_MOCK) return mockThumbnailUrl
  return `/frame/${encodeURIComponent(filename)}?t=${seconds}`
}

// POST /api/videos (multipart, field "video") -> VideoInfo of the saved file
export async function uploadVideo(
  file: File,
  onProgress?: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<VideoInfo> {
  if (USE_MOCK) {
    for (let i = 1; i <= 10; i++) {
      if (signal?.aborted) throw new Error('Upload cancelled')
      await delay(100)
      onProgress?.(i / 10)
    }
    return { filename: file.name, status: 'not-processed' }
  }
  const body = new FormData()
  body.append('video', file)
  return sendWithProgress<VideoInfo>('/api/videos', body, onProgress, signal)
}

// Reads the server's { error } message from a failed response, like fetchJson does.
function errorMessage(status: number, responseText: string): string {
  try {
    const body = JSON.parse(responseText) as { error?: string }
    if (body.error) return body.error
  } catch {
    // The body wasn't JSON, so keep the default message.
  }
  return `Request failed with status ${status}`
}

// POSTs a form with XMLHttpRequest instead of fetch, because fetch can't tell us how
// much of the upload has been sent yet. XHR fires upload.onprogress as the bytes go out.
function sendWithProgress<T>(
  url: string,
  body: FormData,
  onProgress?: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Upload cancelled'))
      return
    }
    const xhr = new XMLHttpRequest()
    const onAbort = () => xhr.abort()
    signal?.addEventListener('abort', onAbort)
    const cleanup = () => signal?.removeEventListener('abort', onAbort)

    xhr.open('POST', url)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) onProgress?.(event.loaded / event.total)
    }
    xhr.onload = () => {
      cleanup()
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(errorMessage(xhr.status, xhr.responseText)))
        return
      }
      try {
        onProgress?.(1)
        resolve(JSON.parse(xhr.responseText) as T)
      } catch {
        reject(new Error('The server sent a response that was not JSON'))
      }
    }
    xhr.onerror = () => {
      cleanup()
      reject(new Error('Network error: could not reach the server'))
    }
    xhr.onabort = () => {
      cleanup()
      reject(new Error('Upload cancelled'))
    }
    onProgress?.(0)
    xhr.send(body)
  })
}

const mockJobs: JobRecord[] = [
  {
    jobId: 'mock-job-123',
    filename: 'bright_balloon_sample_video.mp4',
    targetColor: 'ff0000',
    threshold: 120,
    status: 'done',
    startedAt: '2026-11-19T18:24:00.000Z',
    finishedAt: '2026-11-19T18:26:10.000Z',
    resultUrl: '/mock/result.csv',
  },
  {
    jobId: 'mock-job-122',
    filename: 'salamander2.mov',
    targetColor: 'ffa200',
    threshold: 164,
    status: 'error',
    startedAt: '2026-11-19T17:57:00.000Z',
    error: 'Error processing video',
  },
]

// GET /api/jobs -> JobRecord[], newest first
export async function getJobs(): Promise<JobRecord[]> {
  if (USE_MOCK) {
    await delay(300)
    return mockJobs
  }
  return fetchJson<JobRecord[]>('/api/jobs')
}

// GET /api/jobs/:id -> JobRecord
export async function getJob(jobId: string): Promise<JobRecord> {
  if (USE_MOCK) {
    await delay(200)
    const job = mockJobs.find((j) => j.jobId === jobId)
    if (!job) throw new Error('Job not found')
    return job
  }
  return fetchJson<JobRecord>(`/api/jobs/${encodeURIComponent(jobId)}`)
}

// GET /api/health -> { ok, version }
export async function getHealth(): Promise<{ ok: boolean; version?: string }> {
  if (USE_MOCK) return { ok: true, version: 'mock' }
  return fetchJson<{ ok: boolean; version?: string }>('/api/health')
}

// Downloads a result CSV and parses it into points.
export async function getTrack(resultUrl: string): Promise<TrackPoint[]> {
  const res = await fetch(resultUrl)
  if (!res.ok) throw new Error(`Could not load results (status ${res.status})`)
  return parseTrackCsv(await res.text())
}

export function isMockMode(): boolean {
  return USE_MOCK
}
