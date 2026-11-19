import type { JobStatusResponse, StartJobResponse } from '../api'

// POST /process/:filename -> { jobId }
export const mockStartJob: StartJobResponse = { jobId: 'mock-job-123' }

// GET /process/:jobId/status -> one of these, depending on how the job is going
export const mockProcessing: JobStatusResponse = { status: 'processing' }
export const mockDone: JobStatusResponse = { status: 'done', result: '/mock/result.csv' }
export const mockError: JobStatusResponse = { status: 'error', error: 'Error processing video' }

// How many status checks say "processing" before the mock job says "done"
export const MOCK_CHECKS_BEFORE_DONE = 3
