import { useRef, useState } from 'react'
import type { DragEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Card, Typography } from '@mui/material'
import { isVideoFile } from './videoFilters'

// "Open from this computer": pick or drop a video file and analyse it in the
// browser without uploading it. The file goes to the Analyze page in router state.
export function LocalFileCard() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openFile = (file: File | undefined) => {
    if (!file) return
    if (!isVideoFile(file)) {
      setError(`"${file.name}" is not a video file.`)
      return
    }
    navigate('/analyze/local', { state: { file } })
  }

  // preventDefault stops the browser from opening the dropped file itself
  const onDragOver = (event: DragEvent) => {
    event.preventDefault()
    setDragging(true)
  }
  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    openFile(event.dataTransfer.files[0])
  }

  return (
    <Card
      data-cy="local-file-card"
      onDragOver={onDragOver}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      sx={{
        height: '100%',
        minHeight: 220,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        p: 2,
        textAlign: 'center',
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: dragging ? 'primary.main' : 'divider',
        bgcolor: dragging ? 'action.selected' : 'transparent',
        transition: 'background-color 120ms, border-color 120ms',
      }}
    >
      <Box aria-hidden="true" sx={{ fontSize: 28, lineHeight: 1, color: 'primary.main' }}>
        ⇪
      </Box>
      <Typography variant="subtitle2" component="h2">
        Open from this computer
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Drop a video here, or choose a file. It stays on your computer.
      </Typography>
      <Button size="small" variant="outlined" onClick={() => inputRef.current?.click()}>
        Choose file…
      </Button>
      {error && (
        <Typography variant="caption" color="error" role="alert">
          {error}
        </Typography>
      )}
      {/* Hidden real file input; the button above opens it */}
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        hidden
        aria-label="Open a video from this computer"
        data-cy="local-file-input"
        onChange={(event) => openFile(event.target.files?.[0])}
      />
    </Card>
  )
}
