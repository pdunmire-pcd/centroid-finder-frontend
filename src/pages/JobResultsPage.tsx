import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { Alert, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'
import { getJob, getTrack, getVideoUrl } from '../api'
import type { JobRecord, TrackPoint } from '../types'
import { findSuspectFrames, summarizeTrack } from '../centroid/engine'
import { monoFontFamily } from '../theme'
import { PageBreadcrumbs } from '../components/layout/PageBreadcrumbs'
import { ColorSwatch } from '../components/results/ColorSwatch'
import { JobStatusChip } from '../components/results/JobStatusChip'
import { JobProgressSteps } from '../components/results/JobProgressSteps'
import { ResultsPlayer } from '../components/results/ResultsPlayer'
import { SummaryTiles } from '../components/results/SummaryTiles'
import { PositionChart } from '../components/results/PositionChart'
import { TrackTable } from '../components/results/TrackTable'
import { DEFAULT_MAX_JUMP_PX, pointIndexAt } from '../components/results/trackData'
import { formatDateTime, formatJobDuration, runAgainUrl, shortJobId } from '../components/results/format'
import { useVideoTime } from '../components/results/useVideoTime'

// How often to ask the server about a job that is still processing
const POLL_MS = 2000

// One "label: value" pair in the header
function Setting({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', lineHeight: 1.6 }}>
        {label}
      </Typography>
      <Box sx={{ typography: 'body2' }}>{children}</Box>
    </Box>
  )
}

// Route: /jobs/:jobId
export default function JobResultsPage() {
  const { jobId = '' } = useParams()
  const [job, setJob] = useState<JobRecord | null>(null)
  const [jobError, setJobError] = useState<string | null>(null)
  // Changing this number makes the effect below fetch the job again
  const [pollKey, setPollKey] = useState(0)

  // The parsed CSV, remembered together with the URL it came from
  const [track, setTrack] = useState<{ url: string; points: TrackPoint[] } | null>(null)
  const [trackError, setTrackError] = useState<string | null>(null)

  const { videoRef, currentTime, seek } = useVideoTime()

  // A move bigger than this (px between two tracked frames) is a "suspect jump"
  const [maxJump, setMaxJump] = useState(DEFAULT_MAX_JUMP_PX)

  // 1. Fetch the job (again every time pollKey changes)
  useEffect(() => {
    let ignore = false
    getJob(jobId)
      .then((result) => {
        if (!ignore) {
          setJob(result)
          setJobError(null)
        }
      })
      .catch((err: Error) => {
        if (!ignore) setJobError(err.message)
      })
    return () => {
      ignore = true
    }
  }, [jobId, pollKey])

  // 2. Polling: while the job is processing, schedule one more fetch in 2 s.
  // When the job comes back done or failed this effect does nothing, so the
  // polling stops. Leaving the page runs the cleanup, which cancels the timer.
  const status = job?.status
  useEffect(() => {
    if (status !== 'processing') return
    const timer = window.setTimeout(() => setPollKey((key) => key + 1), POLL_MS)
    return () => window.clearTimeout(timer)
  }, [status, pollKey])

  // 3. When the job is done, download and parse its CSV
  const resultUrl = job?.status === 'done' ? job.resultUrl : undefined
  useEffect(() => {
    if (!resultUrl) return
    let ignore = false
    getTrack(resultUrl)
      .then((points) => {
        if (!ignore) {
          setTrack({ url: resultUrl, points })
          setTrackError(null)
        }
      })
      .catch((err: Error) => {
        if (!ignore) setTrackError(err.message)
      })
    return () => {
      ignore = true
    }
  }, [resultUrl])

  // Only recalculated when a new CSV arrives, not on every video frame
  const summary = useMemo(() => (track ? summarizeTrack(track.points) : null), [track])

  const suspectIndexes = useMemo(
    () => (track ? findSuspectFrames(track.points, maxJump) : []),
    [track, maxJump],
  )

  const crumbs = [{ label: 'Jobs', to: '/jobs' }, { label: shortJobId(jobId) }]

  if (jobError && !job) {
    return (
      <>
        <PageBreadcrumbs items={crumbs} />
        <Alert severity="error" action={<Button component={RouterLink} to="/jobs" color="inherit">Back to jobs</Button>}>
          Could not load job {jobId}: {jobError}
        </Alert>
      </>
    )
  }

  if (!job || job.jobId !== jobId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress aria-label="Loading job" />
      </Box>
    )
  }

  // Only use the track if it belongs to this job's CSV
  const points = track && track.url === resultUrl ? track.points : null
  const duration = formatJobDuration(job)

  return (
    <>
      <PageBreadcrumbs items={crumbs} />

      {/* Header: video name, run settings and actions */}
      <Paper sx={{ p: { xs: 2, sm: 2.5 }, mb: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: { md: 'flex-start' } }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5 }}>
              <Typography variant="h1" sx={{ overflowWrap: 'anywhere' }}>
                {job.filename}
              </Typography>
              <JobStatusChip status={job.status} />
            </Stack>
            <Stack direction="row" sx={{ flexWrap: 'wrap', columnGap: 4, rowGap: 1.5 }}>
              <Setting label="Target color">
                <ColorSwatch color={job.targetColor} />
              </Setting>
              <Setting label="Threshold">{job.threshold}</Setting>
              <Setting label="Started">
                <time dateTime={job.startedAt}>{formatDateTime(job.startedAt)}</time>
              </Setting>
              {duration && <Setting label="Took">{duration}</Setting>}
              <Setting label="Job id">
                <Box component="span" sx={{ fontFamily: monoFontFamily }}>
                  {job.jobId}
                </Box>
              </Setting>
            </Stack>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row', md: 'column', lg: 'row' }} spacing={1} sx={{ flexShrink: 0 }}>
            {job.resultUrl && (
              <Button variant="contained" href={job.resultUrl} download data-cy="download-csv">
                Download CSV
              </Button>
            )}
            <Button variant="outlined" component={RouterLink} to={runAgainUrl(job)} data-cy="run-again">
              Run again with new settings
            </Button>
          </Stack>
        </Stack>

        <Box sx={{ mt: 2 }}>
          <JobProgressSteps job={job} />
        </Box>
      </Paper>

      {job.status === 'done' && trackError && (
        <Alert severity="error">Could not load the results CSV: {trackError}</Alert>
      )}
      {job.status === 'done' && !points && !trackError && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress aria-label="Loading results" />
        </Box>
      )}

      {points && (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 3fr) minmax(0, 2fr)' },
            alignItems: 'start',
          }}
        >
          <ResultsPlayer
            videoUrl={getVideoUrl(job.filename)}
            filename={job.filename}
            points={points}
            currentTime={currentTime}
            videoRef={videoRef}
          />
          <Stack spacing={2}>
            <Typography variant="h2">Summary</Typography>
            {summary && <SummaryTiles summary={summary} />}
          </Stack>

          {/* Full-width row under the video and the tiles */}
          <Paper sx={{ p: 2, gridColumn: '1 / -1' }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 1 }}
            >
              <Box>
                <Typography variant="h2">Position over time</Typography>
                <Typography variant="caption" color="text.secondary">
                  Click anywhere on the chart to jump the video to that time.
                </Typography>
              </Box>
              <TextField
                label="Suspect jump over (px)"
                type="number"
                size="small"
                value={maxJump}
                onChange={(e) => {
                  const value = Number(e.target.value)
                  if (value > 0) setMaxJump(value)
                }}
                slotProps={{ htmlInput: { min: 1, step: 10, 'data-cy': 'max-jump' } }}
                sx={{ width: 190 }}
              />
            </Stack>
            <PositionChart
              points={points}
              suspectIndexes={suspectIndexes}
              // Rounded to 0.1 s, so the chart redraws ~10 times a second instead of 60
              currentTime={Math.round(currentTime * 10) / 10}
              onSeek={seek}
            />
          </Paper>

          <Paper sx={{ p: 2, gridColumn: '1 / -1' }}>
            <TrackTable
              points={points}
              suspectIndexes={suspectIndexes}
              currentIndex={pointIndexAt(points, currentTime)}
              onSeek={seek}
            />
          </Paper>
        </Box>
      )}
    </>
  )
}
