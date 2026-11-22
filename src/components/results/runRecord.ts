import type { TrackSummary } from '../../centroid/engine'
import type { JobRecord } from '../../types'
// Vite only bundles the "version" field, not the whole package.json
import { version } from '../../../package.json'

// A "run record" is a small JSON file a researcher can keep next to the CSV:
// which video, which settings, when it ran, and the summary numbers. It lets
// someone check or repeat the run later.

/** The version in package.json, e.g. "0.0.0" */
export const APP_VERSION: string = version

export type RunRecord = {
  /** bump this if the shape of the file ever changes */
  recordVersion: 1
  app: { name: string; version: string }
  exportedAt: string
  job: {
    jobId: string
    status: JobRecord['status']
    startedAt: string
    finishedAt: string | null
    resultUrl: string | null
  }
  video: { filename: string }
  settings: { targetColor: string; threshold: number; suspectJumpPx: number }
  summary: TrackSummary & { suspectFrames: number }
}

type BuildOptions = {
  job: JobRecord
  summary: TrackSummary
  suspectFrames: number
  suspectJumpPx: number
  /** passed in (not new Date() inside) so tests always get the same result */
  exportedAt: Date
  appVersion?: string
}

/** Builds the record object. Pure: same input, same output. */
export function buildRunRecord({
  job,
  summary,
  suspectFrames,
  suspectJumpPx,
  exportedAt,
  appVersion = APP_VERSION,
}: BuildOptions): RunRecord {
  return {
    recordVersion: 1,
    app: { name: 'Centroid Finder', version: appVersion },
    exportedAt: exportedAt.toISOString(),
    job: {
      jobId: job.jobId,
      status: job.status,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt ?? null,
      resultUrl: job.resultUrl ?? null,
    },
    video: { filename: job.filename },
    settings: {
      targetColor: `#${job.targetColor.replace('#', '').toLowerCase()}`,
      threshold: job.threshold,
      suspectJumpPx,
    },
    summary: { ...summary, suspectFrames },
  }
}

/** "salamander 1.mp4" + job "abc" -> "salamander_1-abc-run.json" */
export function runRecordFileName(job: JobRecord): string {
  const base = job.filename.replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '_')
  return `${base}-${job.jobId}-run.json`
}

/** Makes the browser save `data` as a .json file. */
export function downloadJson(fileName: string, data: unknown): void {
  const text = JSON.stringify(data, null, 2) // 2 spaces, so people can read it
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  // A temporary invisible link that we "click" to start the download
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url) // free the memory
}
