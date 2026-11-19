import { describe, expect, it } from 'vitest'
import { APP_VERSION, buildRunRecord, runRecordFileName } from '../../src/components/results/runRecord'
import type { JobRecord } from '../../src/types'
import type { TrackSummary } from '../../src/centroid/engine'

const job: JobRecord = {
  jobId: 'job-7',
  filename: 'salamander 1.mp4',
  targetColor: 'FFA200',
  threshold: 164,
  status: 'done',
  startedAt: '2026-11-19T10:00:00.000Z',
  finishedAt: '2026-11-19T10:02:00.000Z',
  resultUrl: '/results/job-7.csv',
}

const summary: TrackSummary = {
  frames: 100,
  trackedPct: 90,
  noMatch: 10,
  distancePx: 500,
  avgSpeedPxPerSec: 125,
  durationSeconds: 4,
}

describe('buildRunRecord', () => {
  it('collects the video, settings, times, stats and app version', () => {
    const record = buildRunRecord({
      job,
      summary,
      suspectFrames: 2,
      suspectJumpPx: 100,
      exportedAt: new Date('2026-11-19T12:00:00.000Z'),
      appVersion: '1.2.3',
    })
    expect(record).toEqual({
      recordVersion: 1,
      app: { name: 'Centroid Finder', version: '1.2.3' },
      exportedAt: '2026-11-19T12:00:00.000Z',
      job: {
        jobId: 'job-7',
        status: 'done',
        startedAt: '2026-11-19T10:00:00.000Z',
        finishedAt: '2026-11-19T10:02:00.000Z',
        resultUrl: '/results/job-7.csv',
      },
      video: { filename: 'salamander 1.mp4' },
      settings: { targetColor: '#ffa200', threshold: 164, suspectJumpPx: 100 },
      summary: { ...summary, suspectFrames: 2 },
    })
  })

  it('uses the package.json version by default and null for missing times', () => {
    const record = buildRunRecord({
      job: { ...job, finishedAt: undefined, resultUrl: undefined },
      summary,
      suspectFrames: 0,
      suspectJumpPx: 50,
      exportedAt: new Date(0),
    })
    expect(record.app.version).toBe(APP_VERSION)
    expect(record.job.finishedAt).toBeNull()
    expect(record.job.resultUrl).toBeNull()
  })

  it('survives a JSON round trip unchanged', () => {
    const record = buildRunRecord({ job, summary, suspectFrames: 1, suspectJumpPx: 80, exportedAt: new Date(0) })
    expect(JSON.parse(JSON.stringify(record))).toEqual(record)
  })
})

describe('runRecordFileName', () => {
  it('makes a safe file name from the video and job id', () => {
    expect(runRecordFileName(job)).toBe('salamander_1-job-7-run.json')
  })
})
