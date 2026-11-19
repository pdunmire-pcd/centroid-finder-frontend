import { Chip } from '@mui/material'
import type { ChipProps } from '@mui/material'
import type { VideoInfo } from '../../types'
import { STATUS_LABELS } from './videoFilters'

const COLORS: Record<VideoInfo['status'], ChipProps['color']> = {
  tracked: 'success',
  processing: 'info',
  error: 'error',
  'not-processed': 'default',
}

export function VideoStatusChip({ status }: { status: VideoInfo['status'] }) {
  return (
    <Chip
      size="small"
      label={STATUS_LABELS[status]}
      color={COLORS[status]}
      variant={status === 'not-processed' ? 'outlined' : 'filled'}
      data-cy="video-status"
    />
  )
}
