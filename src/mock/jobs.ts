import type { ProcessingStatus, ProcessResponse } from '../api'

// POST /process/:filename -> { jobId }
export const mockStartJob: ProcessResponse = { jobId: 'mock-job-123' }

// GET /process/:jobId/status -> one of these, depending on how the job is going
export const mockProcessing: ProcessingStatus = { status: 'processing' }
export const mockDone: ProcessingStatus = { status: 'done', result: '/mock/result.csv' }
export const mockError: ProcessingStatus = { status: 'error', error: 'Error processing video' }

// How many status checks say "processing" before the mock job says "done"
export const MOCK_CHECKS_BEFORE_DONE = 3
