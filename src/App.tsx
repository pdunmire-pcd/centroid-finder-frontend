import { Navigate, Route, Routes } from 'react-router-dom'
import { Box, Container } from '@mui/material'
import { TopBar } from './components/layout/TopBar'
import VideoChooserPage from './pages/VideoChooserPage'
import PreviewPage from './pages/PreviewPage'
import JobsPage from './pages/JobsPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <TopBar />

      <Container component="main" maxWidth="xl" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
        {/* One route per line, so new pages are easy to add and merge */}
        <Routes>
          <Route path="/" element={<Navigate to="/videos" replace />} />
          <Route path="/videos" element={<VideoChooserPage />} />
          <Route path="/preview/:filename" element={<PreviewPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Container>
    </Box>
  )
}
