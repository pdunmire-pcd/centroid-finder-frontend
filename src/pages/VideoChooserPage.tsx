import { useEffect, useState } from 'react'
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { getVideoDetails } from '../api'
import type { VideoInfo } from '../types'
import VideoList from '../components/VideoList'
import { withLoading } from '../hoc/withLoading'
import { LocalFileCard } from '../components/videos/LocalFileCard'
import { SORT_LABELS, filterAndSortVideos } from '../components/videos/videoFilters'
import type { VideoSort } from '../components/videos/videoFilters'

const VideoListWithLoading = withLoading(VideoList)

// Route: /videos
export default function VideoChooserPage() {
  const [videos, setVideos] = useState<VideoInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<VideoSort>('name-asc')

  // Changing this number makes the effect below fetch the list again
  const [reloadKey, setReloadKey] = useState(0)

  // Fetch the list when the page first shows up, and again when reloadKey changes
  useEffect(() => {
    // If the user leaves the page before the fetch finishes, don't update state
    let ignore = false

    getVideoDetails()
      .then((list) => {
        if (!ignore) {
          setVideos(list)
          setError(null)
        }
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
  }, [reloadKey])

  const retry = () => {
    setLoading(true)
    setReloadKey((key) => key + 1)
  }

  const shown = filterAndSortVideos(videos, search, sort)
  const emptyMessage =
    videos.length === 0 ? 'No videos on the server yet. Upload one, or open a file from this computer.' : `No videos match "${search}".`

  return (
    <>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ mb: 3, alignItems: { xs: 'stretch', md: 'flex-end' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Typography variant="h1" gutterBottom>
            Videos
          </Typography>
          <Typography color="text.secondary">
            Pick a video to tune the tracking color and run it, or open one from this computer.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            label="Search videos"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{ htmlInput: { 'data-cy': 'video-search' } }}
          />
          <TextField
            select
            label="Sort by"
            size="small"
            value={sort}
            onChange={(e) => setSort(e.target.value as VideoSort)}
            sx={{ minWidth: 160 }}
          >
            {(Object.keys(SORT_LABELS) as VideoSort[]).map((key) => (
              <MenuItem key={key} value={key}>
                {SORT_LABELS[key]}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Stack>

      <VideoListWithLoading
        loading={loading}
        error={error}
        videos={shown}
        firstCard={<LocalFileCard />}
        emptyMessage={emptyMessage}
      />

      {/* If the server is down you can still open a local file */}
      {error && (
        <Stack spacing={2} sx={{ mt: 2, maxWidth: 320 }}>
          <Button variant="outlined" onClick={retry} sx={{ alignSelf: 'flex-start' }}>
            Try again
          </Button>
          <LocalFileCard />
        </Stack>
      )}
    </>
  )
}
