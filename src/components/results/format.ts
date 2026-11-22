import type { JobRecord } from '../../types'

// Small formatting helpers shared by the Jobs and Job results pages.
// Pure functions (no React), so they are unit tested in tests/results.

/** Long ids (like UUIDs) are cut to 8 characters; short ones are kept. */
export function shortJobId(jobId: string): string {
  return jobId.length <= 12 ? jobId : jobId.slice(0, 8)
}

/** "ff0000" or "#ff0000" -> "#ff0000" (lower case) */
export function toCssHex(color: string): string {
  return `#${color.replace('#', '').toLowerCase()}`
}

/** "3 min ago", "2 h ago", "yesterday"... `now` is a parameter so tests can fix it. */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const seconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000)
  const format = new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'short' })
  const abs = Math.abs(seconds)
  if (abs < 45) return 'just now'
  if (abs < 3600) return format.format(Math.round(seconds / 60), 'minute')
  if (abs < 86400) return format.format(Math.round(seconds / 3600), 'hour')
  return format.format(Math.round(seconds / 86400), 'day')
}

/** Full local date and time, e.g. "19 Nov 2026, 10:24:00" */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  })
}

/** 83.4 -> "1:23.4"; 9.04 -> "0:09.0" */
export function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds - m * 60
  return `${m}:${s.toFixed(1).padStart(4, '0')}`
}

/** How long a job took, e.g. "2 min 10 s". Undefined while it is still running. */
export function formatJobDuration(job: JobRecord): string | undefined {
  if (!job.finishedAt) return undefined
  const total = Math.round((new Date(job.finishedAt).getTime() - new Date(job.startedAt).getTime()) / 1000)
  const m = Math.floor(total / 60)
  return m > 0 ? `${m} min ${total % 60} s` : `${total} s`
}

export type JobFilter = 'all' | JobRecord['status']

/** Jobs with the chosen status, newest first. Does not change the input array. */
export function filterJobs(jobs: JobRecord[], filter: JobFilter): JobRecord[] {
  return jobs
    .filter((job) => filter === 'all' || job.status === filter)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
}

/** Link to the Analyze page with this job's settings filled in. */
export function runAgainUrl(job: JobRecord): string {
  const params = new URLSearchParams({ color: job.targetColor, threshold: String(job.threshold) })
  return `/analyze/${encodeURIComponent(job.filename)}?${params}`
}
