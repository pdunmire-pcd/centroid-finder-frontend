import type { ProcessingStatus, ProcessResponse } from '../../api'

export async function mockProcessVideo(): Promise<ProcessResponse> {
  return { jobId: 'mock-job-1' }
}

export async function mockProcessingStatus(
  pollCount: number,
): Promise<ProcessingStatus> {
  if (pollCount < 3) {
    return { status: 'processing' }
  }

  return { status: 'done', result: '/results/mock-job-1.csv' }
}