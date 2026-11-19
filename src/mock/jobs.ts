import type { ProcessingStatus, ProcessResponse } from '../api'
import type { JobRecord } from '../types'

// POST /process/:filename -> { jobId }
export const mockStartJob: ProcessResponse = { jobId: 'mock-job-123' }

// GET /process/:jobId/status -> one of these, depending on how the job is going
export const mockProcessing: ProcessingStatus = { status: 'processing' }
export const mockDone: ProcessingStatus = { status: 'done', result: '/mock/result.csv' }
export const mockError: ProcessingStatus = { status: 'error', error: 'Error processing video' }

// How many status checks say "processing" before the mock job says "done"
export const MOCK_CHECKS_BEFORE_DONE = 3

// The CSV every finished mock job points to. It's real output from videoprocessor.jar
// for public/mock/sample.mp4 (targetColor FF4500, threshold 100): one row per frame.
export const MOCK_RESULT_URL = '/mock/result.csv'

// GET /api/jobs at the start of a mock session, newest first: one of each status.
export const initialMockJobs: JobRecord[] = [
  {
    jobId: 'mock-job-124',
    filename: 'salamander1.mp4',
    targetColor: '660005',
    threshold: 40,
    status: 'processing',
    startedAt: '2026-11-19T18:40:00.000Z',
  },
  {
    jobId: 'mock-job-123',
    filename: 'bright_balloon_sample_video.mp4',
    targetColor: 'ff4500',
    threshold: 100,
    status: 'done',
    startedAt: '2026-11-19T18:24:00.000Z',
    finishedAt: '2026-11-19T18:24:41.000Z',
    resultUrl: MOCK_RESULT_URL,
  },
  {
    jobId: 'mock-job-122',
    filename: 'salamander2.mov',
    targetColor: 'zzzzzz',
    threshold: 164,
    status: 'error',
    startedAt: '2026-11-19T17:57:00.000Z',
    finishedAt: '2026-11-19T17:57:02.000Z',
    error: 'Error processing video: the JAR exited with code 1',
  },
  {
    jobId: 'mock-job-121',
    filename: 'bright_balloon_sample_video.mp4',
    targetColor: 'ff0000',
    threshold: 120,
    status: 'done',
    startedAt: '2026-11-18T21:10:00.000Z',
    finishedAt: '2026-11-18T21:10:39.000Z',
    resultUrl: MOCK_RESULT_URL,
  },
]
