import { describe, expect, it } from 'vitest'
import {
  filterJobs,
  formatJobDuration,
  formatRelativeTime,
  formatSeconds,
  shortJobId,
  toCssHex,
} from '../../src/components/results/format'
import type { JobRecord } from '../../src/types'

const job = (jobId: string, status: JobRecord['status'], startedAt: string): JobRecord => ({
  jobId,
  filename: 'v.mp4',
  targetColor: 'ff0000',
  threshold: 100,
  status,
  startedAt,
})

describe('format helpers', () => {
  it('shortens long job ids only', () => {
    expect(shortJobId('mock-job-123')).toBe('mock-job-123')
    expect(shortJobId('3f2a9c1e-1111-2222-3333-444455556666')).toBe('3f2a9c1e')
  })

  it('adds # to hex colors', () => {
    expect(toCssHex('FFA200')).toBe('#ffa200')
    expect(toCssHex('#00ff00')).toBe('#00ff00')
  })

  it('formats relative times', () => {
    const now = new Date('2026-11-19T12:00:00Z')
    expect(formatRelativeTime('2026-11-19T11:59:50Z', now)).toBe('just now')
    expect(formatRelativeTime('2026-11-19T11:55:00Z', now)).toBe('5 min. ago')
    expect(formatRelativeTime('2026-11-19T09:00:00Z', now)).toBe('3 hr. ago')
    expect(formatRelativeTime('2026-11-18T12:00:00Z', now)).toBe('yesterday')
  })

  it('formats seconds as m:ss.s', () => {
    expect(formatSeconds(9.04)).toBe('0:09.0')
    expect(formatSeconds(83.4)).toBe('1:23.4')
  })

  it('formats how long a job took', () => {
    const done = { ...job('a', 'done', '2026-11-19T10:00:00Z'), finishedAt: '2026-11-19T10:02:10Z' }
    expect(formatJobDuration(done)).toBe('2 min 10 s')
    expect(formatJobDuration(job('b', 'processing', '2026-11-19T10:00:00Z'))).toBeUndefined()
  })
})

describe('filterJobs', () => {
  const jobs = [
    job('old', 'done', '2026-11-18T10:00:00Z'),
    job('new', 'error', '2026-11-19T10:00:00Z'),
    job('mid', 'done', '2026-11-18T20:00:00Z'),
  ]

  it('sorts newest first', () => {
    expect(filterJobs(jobs, 'all').map((j) => j.jobId)).toEqual(['new', 'mid', 'old'])
  })

  it('keeps only the chosen status', () => {
    expect(filterJobs(jobs, 'done').map((j) => j.jobId)).toEqual(['mid', 'old'])
    expect(filterJobs(jobs, 'processing')).toEqual([])
  })

  it('does not change the original array', () => {
    filterJobs(jobs, 'all')
    expect(jobs[0].jobId).toBe('old')
  })
})
