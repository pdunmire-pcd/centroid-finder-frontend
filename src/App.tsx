import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { AppBar, Container, Toolbar, Typography } from '@mui/material'
import VideoChooserPage from './pages/VideoChooserPage'
import PreviewPage from './pages/PreviewPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component={Link}
            to="/videos"
            sx={{ color: 'inherit', textDecoration: 'none' }}
          >
            Centroid Finder
          </Typography>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: 4 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/videos" replace />} />
          <Route path="/videos" element={<VideoChooserPage />} />
          <Route path="/preview/:filename" element={<PreviewPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Container>
    </>
  )
}
