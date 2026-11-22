import { Link } from 'react-router-dom'
import { Box, Card, CardActionArea, Stack, Typography } from '@mui/material'
import { getThumbnailUrl } from '../../api'
import type { VideoInfo } from '../../types'
import { VideoStatusChip } from './VideoStatusChip'

// Turns 83.4 into "1:23"
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

// One video in the grid. The whole card is a link to the Analyze page.
export function VideoCard({ video }: { video: VideoInfo }) {
  const details = [
    video.width && video.height ? `${video.width}×${video.height}` : null,
    video.durationSeconds !== undefined ? formatDuration(video.durationSeconds) : null,
  ].filter(Boolean)

  return (
    <Card data-cy="video-card" sx={{ height: '100%' }}>
      <CardActionArea
        component={Link}
        to={`/analyze/${encodeURIComponent(video.filename)}`}
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        {/* 16:9 box so every card is the same height, even before the image loads */}
        <Box sx={{ position: 'relative', aspectRatio: '16 / 9', bgcolor: 'action.hover' }}>
          <Box
            component="img"
            src={getThumbnailUrl(video.filename)}
            alt={`First frame of ${video.filename}`}
            loading="lazy" // the browser only downloads it when it scrolls into view
            sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </Box>
        <Stack spacing={1.25} sx={{ p: 2, flexGrow: 1 }}>
          <Typography variant="subtitle2" component="h2" noWrap title={video.filename}>
            {video.filename}
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <VideoStatusChip status={video.status} />
            {details.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                {details.join(' · ')}
              </Typography>
            )}
          </Stack>
        </Stack>
      </CardActionArea>
    </Card>
  )
}
