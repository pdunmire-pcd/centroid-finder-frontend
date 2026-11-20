import { Link } from 'react-router-dom'
import { Box, Card, CardActionArea, CardContent, CardMedia, Typography } from '@mui/material'
import { getThumbnailUrl } from '../api'

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
            <CardMedia
              component="img"
              height="150"
              image={getThumbnailUrl(filename)}
              alt={`First frame of ${filename}`}
              sx={{ objectFit: 'cover', bgcolor: 'grey.200' }}
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
