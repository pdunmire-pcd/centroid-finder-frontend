import type { ReactNode } from 'react'
import { Box, Typography } from '@mui/material'
import type { VideoInfo } from '../types'
import { VideoCard } from './videos/VideoCard'

type VideoListProps = {
  videos: VideoInfo[]
  /** optional card shown first in the grid, e.g. "Open from this computer" */
  firstCard?: ReactNode
  /** shown under the grid when there are no videos */
  emptyMessage?: string
}

// Just displays the videos it's given (no fetching), so it's easy to wrap with withLoading.
export default function VideoList({ videos, firstCard, emptyMessage = 'No videos found.' }: VideoListProps) {
  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          // As many 220 px columns as fit; one column on a phone
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        }}
      >
        {firstCard}
        {videos.map((video) => (
          <VideoCard key={video.filename} video={video} />
        ))}
      </Box>
      {videos.length === 0 && (
        <Typography color="text.secondary" sx={{ mt: 2 }} data-cy="videos-empty">
          {emptyMessage}
        </Typography>
      )}
    </>
  )
}
