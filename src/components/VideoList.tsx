import { Link } from 'react-router-dom'
import { Box, Card, CardActionArea, CardContent, CardMedia, Typography } from '@mui/material'
import type React from 'react'
import { getThumbnailUrl, getVideoUrl } from '../api'

type VideoListProps = {
  videos: string[]
}

// Just displays the videos it's given (no fetching), so it's easy to wrap with withLoading.
export default function VideoList({ videos }: VideoListProps) {
  if (videos.length === 0) {
    return <Typography color="text.secondary">No videos found in the videos folder.</Typography>
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 3,
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
      }}
    >
      {videos.map((filename) => (
        <Card key={filename} data-cy="video-card">
          {/* The whole card is a link to the preview page */}
          <CardActionArea component={Link} to={`/preview/${encodeURIComponent(filename)}`}>
            {/* Shows the thumbnail as a poster, and plays a muted preview on hover */}
            <CardMedia
              component="video"
              src={getVideoUrl(filename)}
              poster={getThumbnailUrl(filename)}
              aria-label={`Preview of ${filename}`}
              data-cy="video-preview"
              muted
              loop
              playsInline
              preload="none"
              onMouseEnter={(event: React.MouseEvent<HTMLVideoElement>) => {
                // play() rejects if the browser blocks it; the poster stays visible, which is fine.
                event.currentTarget.play().catch(() => {})
              }}
              onMouseLeave={(event: React.MouseEvent<HTMLVideoElement>) => {
                event.currentTarget.pause()
                event.currentTarget.currentTime = 0
              }}
              sx={{ height: 150, width: '100%', objectFit: 'cover', bgcolor: 'grey.200', display: 'block' }}
            />
            <CardContent>
              <Typography variant="subtitle1" noWrap title={filename}>
                {filename}
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      ))}
    </Box>
  )
}
