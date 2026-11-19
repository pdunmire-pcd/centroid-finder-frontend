import { Link } from 'react-router-dom'
import { Button, Typography } from '@mui/material'

export default function NotFoundPage() {
  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Page not found
      </Typography>
      <Button component={Link} to="/videos" variant="contained">
        Go to videos
      </Button>
    </>
  )
}
