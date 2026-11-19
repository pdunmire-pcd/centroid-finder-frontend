// One function per backend endpoint. Components call these instead of fetch() directly,
// so the URLs live in one place and we can swap in mock data with one switch.

import { mockVideoList, mockThumbnailUrl } from './mock/videos'
import { MOCK_CHECKS_BEFORE_DONE, mockDone, mockProcessing, mockStartJob } from './mock/jobs'

// `npm run dev:mock` loads .env.mock, which sets this to "true"
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// ---- Response types (same shapes our Express server sends) ----

export type StartJobResponse = { jobId: string }

export type JobStatusResponse =
  | { status: 'processing' }
  | { status: 'done'; result: string } // result is a URL like /results/<jobId>.csv
  | { status: 'error'; error: string }

// ---- Helpers ----

// Pretend the mock "network" takes a moment, so loading spinners actually show up
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// fetch() only rejects on network failure, so we also throw on 4xx/5xx responses.
// Our server sends errors as { error: "..." }, so we use that message when it's there.
async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`
    try {
      const body = await res.json()
      if (body.error) message = body.error
    } catch {
      // the body wasn't JSON, keep the default message
    }
    throw new Error(message)
  }
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
// This returns a URL (not data) because an <img> or canvas Image can load it directly.
export function getThumbnailUrl(filename: string): string {
  if (USE_MOCK) return mockThumbnailUrl
  return `/thumbnail/${encodeURIComponent(filename)}`
}

// POST /process/:filename?targetColor=<hex>&threshold=<int>
// targetColor is hex WITHOUT the "#", like "FFA200" (same as the Java program expects)
export async function startProcessing(
  filename: string,
  targetColor: string,
  threshold: number,
): Promise<StartJobResponse> {
  const color = targetColor.replace('#', '')
  if (USE_MOCK) {
    await delay(300)
    mockStatusChecks = 0
    return mockStartJob
  }
  const params = new URLSearchParams({ targetColor: color, threshold: String(threshold) })
  return fetchJson<StartJobResponse>(`/process/${encodeURIComponent(filename)}?${params}`, {
    method: 'POST',
  })
}

// GET /process/:jobId/status
let mockStatusChecks = 0
export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  if (USE_MOCK) {
    await delay(200)
    mockStatusChecks++
    return mockStatusChecks > MOCK_CHECKS_BEFORE_DONE ? mockDone : mockProcessing
  }
  return fetchJson<JobStatusResponse>(`/process/${encodeURIComponent(jobId)}/status`)
}
