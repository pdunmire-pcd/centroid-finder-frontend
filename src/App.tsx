import { Navigate, Route, Routes } from 'react-router-dom'
import { Box, Container } from '@mui/material'
import { TopBar } from './components/layout/TopBar'
import { SkipLink, MAIN_CONTENT_ID } from './components/layout/SkipLink'
import VideoChooserPage from './pages/VideoChooserPage'
import AnalyzePage, { PreviewRedirect } from './pages/AnalyzePage'
import JobsPage from './pages/JobsPage'
import JobResultsPage from './pages/JobResultsPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
      {/* First thing the Tab key reaches: jump past the top bar */}
      <SkipLink />
      <TopBar />

      {/* maxWidth="xl" (1536 px) keeps lines and panels a comfortable size on
          wide 1920-2560 px screens; the page gutters grow with the screen. */}
      <Container
        component="main"
        id={MAIN_CONTENT_ID}
        tabIndex={-1} // so the skip link can move focus here
        maxWidth="xl"
        sx={{
          py: { xs: 3, sm: 4, md: 5 },
          px: { xs: 2, sm: 3, md: 4 },
          '&:focus': { outline: 'none' }, // focus lands here only from the skip link
        }}
      >
        {/* One route per line, so new pages are easy to add and merge */}
        <Routes>
          <Route path="/" element={<Navigate to="/videos" replace />} />
          <Route path="/videos" element={<VideoChooserPage />} />
          <Route path="/analyze/local" element={<AnalyzePage />} />
          <Route path="/analyze/:filename" element={<AnalyzePage />} />
          <Route path="/preview/:filename" element={<PreviewRedirect />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:jobId" element={<JobResultsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Container>
    </Box>
  )
}
