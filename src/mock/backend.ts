// A tiny pretend server for `npm run dev:mock`. It keeps videos and jobs in memory
// and follows the same rules as the Express server, so pages behave the same way:
// a new job is "processing", then "done" after a few status checks; uploads show up
// in the video list; a video's status comes from its newest job.

import type { ProcessingStatus, ProcessResponse } from '../api'
import type { JobRecord, VideoInfo } from '../types'
import { MOCK_CHECKS_BEFORE_DONE, MOCK_RESULT_URL, initialMockJobs } from './jobs'
import { mockVideoList, mockVideoProbe } from './videos'

let videos: string[] = []
let jobs: JobRecord[] = [] // newest first, like GET /api/jobs
let statusChecks = new Map<string, number>() // jobId -> how many times it was polled
let nextJobNumber = 1000

/** Puts the mock back to how it starts (tests call this). */
export function resetMockBackend(): void {
  videos = [...mockVideoList]
  jobs = initialMockJobs.map((job) => ({ ...job }))
  statusChecks = new Map()
  nextJobNumber = 1000
}
resetMockBackend()

// The newest job decides the status, like the server's /api/videos/details
function statusOf(filename: string): VideoInfo['status'] {
  const newest = jobs.find((job) => job.filename === filename)
  if (!newest) return 'not-processed'
  return newest.status === 'done' ? 'tracked' : newest.status
}

export function mockListVideos(): string[] {
  return [...videos]
}

export function mockVideoDetails(): VideoInfo[] {
  return videos.map((filename) => ({ filename, status: statusOf(filename), ...mockVideoProbe }))
}

export function mockAddVideo(filename: string): VideoInfo {
  if (videos.includes(filename)) throw new Error('A video with that name already exists')
  if (!/\.(mp4|mov)$/i.test(filename)) throw new Error('Only .mp4 and .mov videos can be uploaded')
  videos.push(filename)
  return { filename, status: 'not-processed', ...mockVideoProbe }
}

export function mockListJobs(): JobRecord[] {
  return jobs.map((job) => ({ ...job }))
}

export function mockFindJob(jobId: string): JobRecord {
  const job = jobs.find((j) => j.jobId === jobId)
  if (!job) throw new Error('Job ID not found')
  return { ...job }
}

export function mockStartProcessing(filename: string, targetColor: string, threshold: number): ProcessResponse {
  const jobId = `mock-job-${nextJobNumber++}`
  jobs.unshift({
    jobId,
    filename,
    targetColor: targetColor.toLowerCase(),
    threshold,
    status: 'processing',
    startedAt: new Date().toISOString(),
  })
  return { jobId }
}

// GET /process/:jobId/status. A processing job finishes after MOCK_CHECKS_BEFORE_DONE checks.
export function mockCheckStatus(jobId: string): ProcessingStatus {
  const job = jobs.find((j) => j.jobId === jobId)
  if (!job) throw new Error('Job ID not found')

  if (job.status === 'processing') {
    const checks = (statusChecks.get(jobId) ?? 0) + 1
    statusChecks.set(jobId, checks)
    if (checks > MOCK_CHECKS_BEFORE_DONE) {
      job.status = 'done'
      job.finishedAt = new Date().toISOString()
      job.resultUrl = MOCK_RESULT_URL
    }
  }

  if (job.status === 'done') return { status: 'done', result: job.resultUrl ?? MOCK_RESULT_URL }
  if (job.status === 'error') return { status: 'error', error: job.error ?? 'Error processing video' }
  return { status: 'processing' }
}
