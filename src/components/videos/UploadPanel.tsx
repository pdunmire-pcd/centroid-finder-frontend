import { useRef, useState } from 'react'
import { Alert, Box, Button, LinearProgress, Paper, Stack, Typography } from '@mui/material'
import { uploadVideo } from '../../api'
import type { VideoInfo } from '../../types'
import { isVideoFile } from './videoFilters'

type UploadState =
  | { kind: 'idle' }
  | { kind: 'uploading'; fileName: string; progress: number }
  | { kind: 'done'; fileName: string }
  | { kind: 'cancelled' }
  | { kind: 'error'; message: string }

type UploadPanelProps = {
  /** called after a successful upload, so the page can refresh its list */
  onUploaded: (video: VideoInfo) => void
}

// "Upload to server" button plus a progress bar with Cancel.
export function UploadPanel({ onUploaded }: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  // The controller lets the Cancel button stop the request
  const controllerRef = useRef<AbortController | null>(null)
  const [state, setState] = useState<UploadState>({ kind: 'idle' })

  const startUpload = async (file: File | undefined) => {
    if (!file) return
    if (!isVideoFile(file)) {
      setState({ kind: 'error', message: `"${file.name}" is not a video file.` })
      return
    }

    const controller = new AbortController()
    controllerRef.current = controller
    setState({ kind: 'uploading', fileName: file.name, progress: 0 })

    try {
      const video = await uploadVideo(
        file,
        (fraction) => setState({ kind: 'uploading', fileName: file.name, progress: fraction }),
        controller.signal,
      )
      setState({ kind: 'done', fileName: video.filename })
      onUploaded(video)
    } catch (err) {
      // An abort also ends up here; show it as "cancelled", not as an error
      if (controller.signal.aborted) {
        setState({ kind: 'cancelled' })
      } else {
        setState({ kind: 'error', message: err instanceof Error ? err.message : 'Upload failed' })
      }
    } finally {
      controllerRef.current = null
      // Clear the input so choosing the same file again still fires onChange
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const cancel = () => controllerRef.current?.abort()

  return (
    <Box>
      <Button
        variant="contained"
        onClick={() => inputRef.current?.click()}
        disabled={state.kind === 'uploading'}
        data-cy="upload-button"
        sx={{ whiteSpace: 'nowrap', height: 40 }}
      >
        Upload to server
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        hidden
        aria-label="Upload a video to the server"
        data-cy="upload-input"
        onChange={(event) => startUpload(event.target.files?.[0])}
      />

      {state.kind === 'uploading' && (
        <Paper data-cy="upload-progress" sx={{ p: 1.5, mt: 1.5, minWidth: 260 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" noWrap title={state.fileName}>
              Uploading {state.fileName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(state.progress * 100)}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={state.progress * 100}
            aria-label="Upload progress"
            sx={{ my: 1 }}
          />
          <Button size="small" color="inherit" onClick={cancel}>
            Cancel
          </Button>
        </Paper>
      )}
      {state.kind === 'done' && (
        <Alert severity="success" onClose={() => setState({ kind: 'idle' })} sx={{ mt: 1.5 }}>
          Uploaded {state.fileName}
        </Alert>
      )}
      {state.kind === 'cancelled' && (
        <Alert severity="info" onClose={() => setState({ kind: 'idle' })} sx={{ mt: 1.5 }}>
          Upload cancelled
        </Alert>
      )}
      {state.kind === 'error' && (
        <Alert severity="error" onClose={() => setState({ kind: 'idle' })} sx={{ mt: 1.5 }}>
          Upload failed: {state.message}
        </Alert>
      )}
    </Box>
  )
}
