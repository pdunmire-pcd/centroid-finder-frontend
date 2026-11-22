import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import { getJobs } from '../api'
import type { JobRecord } from '../types'
import { monoFontFamily, visuallyHiddenSx } from '../theme'
import { ColorSwatch } from '../components/results/ColorSwatch'
import { ScrollableTable } from '../components/shared/ScrollableTable'
import { JobStatusChip } from '../components/results/JobStatusChip'
import { filterJobs, formatDateTime, formatRelativeTime, shortJobId } from '../components/results/format'
import type { JobFilter } from '../components/results/format'

// How often to refresh while at least one job is still processing
const REFRESH_MS = 3000

const FILTERS: { value: JobFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'processing', label: 'Processing' },
  { value: 'done', label: 'Done' },
  { value: 'error', label: 'Error' },
]

// Route: /jobs  -- the history of every processing run
export default function JobsPage() {
  const [jobs, setJobs] = useState<JobRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<JobFilter>('all')
  // Changing this number makes the effect below fetch the jobs again
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let ignore = false
    getJobs()
      .then((list) => {
        if (!ignore) {
          setJobs(list)
          setError(null)
        }
      })
      .catch((err: Error) => {
        if (!ignore) setError(`Could not load jobs: ${err.message}`)
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [reloadKey])

  // Auto-refresh: only while some job is still processing. When the last one
  // finishes, anyProcessing becomes false, the cleanup clears the interval
  // and no new one is started, so polling stops by itself.
  const anyProcessing = jobs.some((job) => job.status === 'processing')
  useEffect(() => {
    if (!anyProcessing) return
    const interval = window.setInterval(() => setReloadKey((key) => key + 1), REFRESH_MS)
    return () => window.clearInterval(interval)
  }, [anyProcessing])

  const shown = filterJobs(jobs, filter)
  const countFor = (value: JobFilter) => filterJobs(jobs, value).length

  return (
    <>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3, justifyContent: 'space-between', alignItems: { sm: 'flex-end' } }}
      >
        <Box>
          <Typography variant="h1" gutterBottom>
            Jobs
          </Typography>
          <Typography color="text.secondary">
            Every processing run, newest first.
            {anyProcessing && ' Refreshing automatically while a job is running.'}
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => setReloadKey((key) => key + 1)} sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }}>
          Refresh
        </Button>
      </Stack>

      {/* Filter chips: role="group" + aria-pressed tells screen readers which one is on */}
      <Stack direction="row" spacing={1} useFlexGap role="group" aria-label="Filter by status" sx={{ mb: 3, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <Chip
            key={f.value}
            label={`${f.label} (${countFor(f.value)})`}
            color={filter === f.value ? 'primary' : 'default'}
            variant={filter === f.value ? 'filled' : 'outlined'}
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            data-cy={`job-filter-${f.value}`}
          />
        ))}
      </Stack>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress aria-label="Loading jobs" />
        </Box>
      )}
      {!loading && error && <Alert severity="error">{error}</Alert>}
      {/* Announces the number of jobs shown when a filter changes */}
      <Box role="status" sx={visuallyHiddenSx}>
        {!loading && !error && `${shown.length} ${shown.length === 1 ? 'job' : 'jobs'} shown`}
      </Box>

      {!loading && !error && (
        // Scrolls sideways on a phone instead of squashing (with a visible hint)
        <ScrollableTable label="Processing jobs">
          <Table size="small" aria-label="Processing jobs" sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow>
                <TableCell>Job</TableCell>
                <TableCell>Video</TableCell>
                <TableCell>Target color</TableCell>
                <TableCell align="right">Threshold</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Started</TableCell>
                <TableCell align="right">
                  <Box component="span" sx={visuallyHiddenSx}>
                    Actions
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shown.map((job) => (
                <TableRow key={job.jobId} hover data-cy="job-row">
                  <TableCell sx={{ fontFamily: monoFontFamily, whiteSpace: 'nowrap' }} title={job.jobId}>
                    {shortJobId(job.jobId)}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 240 }}>
                    <Typography variant="body2" noWrap title={job.filename}>
                      {job.filename}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <ColorSwatch color={job.targetColor} />
                  </TableCell>
                  <TableCell align="right">{job.threshold}</TableCell>
                  <TableCell>
                    <JobStatusChip status={job.status} />
                    {job.status === 'error' && job.error && (
                      <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                        {job.error}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {/* Relative time, with the exact time on hover */}
                    <Tooltip title={formatDateTime(job.startedAt)}>
                      <Box component="time" dateTime={job.startedAt} tabIndex={0} sx={{ whiteSpace: 'nowrap' }}>
                        {formatRelativeTime(job.startedAt)}
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      component={RouterLink}
                      to={`/jobs/${encodeURIComponent(job.jobId)}`}
                      // starts with the visible word, as WCAG 2.5.3 (label in name) asks
                      aria-label={`${job.status === 'done' ? 'Results' : 'Details'} for job ${job.jobId}`}
                    >
                      {job.status === 'done' ? 'Results' : 'Details'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {shown.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                    {jobs.length === 0
                      ? 'No jobs yet. Process a video from the Videos page to see it here.'
                      : 'No jobs with this status.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollableTable>
      )}
    </>
  )
}
