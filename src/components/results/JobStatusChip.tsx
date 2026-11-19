import { Chip } from '@mui/material'
import type { ChipProps } from '@mui/material'
import type { JobRecord } from '../../types'

const LABELS: Record<JobRecord['status'], string> = {
  processing: 'Processing',
  done: 'Done',
  error: 'Error',
}

const COLORS: Record<JobRecord['status'], ChipProps['color']> = {
  processing: 'info',
  done: 'success',
  error: 'error',
}

export function JobStatusChip({ status }: { status: JobRecord['status'] }) {
  return <Chip size="small" label={LABELS[status]} color={COLORS[status]} data-cy="job-status" />
}
