import { Link } from 'react-router-dom'
import { Button, Paper, Stack, Typography } from '@mui/material'

export default function NotFoundPage() {
  return (
    <Paper sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center', maxWidth: 560, mx: 'auto', mt: 4 }}>
      <Typography variant="overline" color="text.secondary">
        Error 404
      </Typography>
      <Typography variant="h1" gutterBottom>
        Page not found
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        This address doesn't match any page. It may have been mistyped or moved.
      </Typography>
      <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'center' }}>
        <Button component={Link} to="/videos" variant="contained">
          Go to videos
        </Button>
        <Button component={Link} to="/jobs" variant="outlined">
          View jobs
        </Button>
      </Stack>
    </Paper>
  )
}
