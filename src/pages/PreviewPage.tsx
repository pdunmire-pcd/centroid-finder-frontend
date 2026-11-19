import { Link, useParams } from 'react-router-dom'
import { Box, Button, Paper, Typography } from '@mui/material'
import { getThumbnailUrl } from '../api'

// Route: /preview/:filename
// Starter version: shows the first frame. Nadia's binarized canvas and
// Paris's slider / color picker / process button plug in where marked below.
export default function PreviewPage() {
  // React Router already decodes the URL, so "my%20video.mp4" becomes "my video.mp4"
  const { filename = '' } = useParams()

  return (
    <>
      <Button component={Link} to="/videos" sx={{ mb: 2 }}>
        ← Back to videos
      </Button>
      <Typography variant="h4" component="h1" gutterBottom>
        {filename}
      </Typography>

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Original
          </Typography>
          <Box
            component="img"
            src={getThumbnailUrl(filename)}
            alt={`First frame of ${filename}`}
            sx={{ width: '100%', display: 'block' }}
          />
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Binarized
          </Typography>
          {/* TODO (Nadia): binarized canvas + centroid dot */}
          <Typography color="text.secondary">Binarized preview goes here.</Typography>
        </Paper>
      </Box>

      {/* TODO (Paris): threshold slider, color picker, process button, job status */}
    </>
  )
}
