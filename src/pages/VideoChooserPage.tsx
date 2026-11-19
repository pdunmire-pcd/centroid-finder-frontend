import { useEffect, useState } from 'react'
import { Typography } from '@mui/material'
import { getVideos } from '../api'
import VideoList from '../components/VideoList'
import { withLoading } from '../hoc/withLoading'

const VideoListWithLoading = withLoading(VideoList)

// Route: /videos
export default function VideoChooserPage() {
  const [videos, setVideos] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch the video list once, when the page first shows up
  useEffect(() => {
    // If the user leaves the page before the fetch finishes, don't update state
    let ignore = false

    getVideos()
      .then((list) => {
        if (!ignore) setVideos(list)
      })
      .catch((err: Error) => {
        if (!ignore) setError(`Could not load videos: ${err.message}`)
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [])

  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Choose a Video
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Pick a video to preview and tune the color tracking settings.
      </Typography>
      <VideoListWithLoading loading={loading} error={error} videos={videos} />
    </>
  )
}
