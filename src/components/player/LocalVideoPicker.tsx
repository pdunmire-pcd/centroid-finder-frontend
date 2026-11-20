import { alpha, Box, Button, Typography, type ButtonProps } from '@mui/material'
import { useRef, useState, type DragEvent, type ReactNode } from 'react'

export type LocalVideoPickerProps = {
  onFile: (file: File) => void
  label?: string
  variant?: ButtonProps['variant']
}

/**
 * An "Open from this computer" button. Browsers only let a page read a file
 * the user picked, so we click a hidden <input type="file"> for them.
 */
export function LocalVideoPicker({
  onFile,
  label = 'Open from this computer',
  variant = 'outlined',
}: LocalVideoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <Button variant={variant} onClick={() => inputRef.current?.click()}>
        {label}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        hidden
        data-testid="local-file-input"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onFile(file)
          event.target.value = '' // so picking the same file again still fires onChange
        }}
      />
    </>
  )
}

export type VideoDropZoneProps = {
  onFile: (file: File) => void
  children: ReactNode
}

/** Wraps part of the page so a video file can be dragged and dropped onto it. */
export function VideoDropZone({ onFile, children }: VideoDropZoneProps) {
  const [dragging, setDragging] = useState(false)

  const onDragOver = (event: DragEvent) => {
    event.preventDefault() // without this the browser opens the file itself
    setDragging(true)
  }

  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <Box
      data-testid="drop-zone"
      onDragOver={onDragOver}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      sx={{ position: 'relative' }}
    >
      {children}
      {dragging && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            border: '3px dashed',
            borderColor: 'primary.main',
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.9), // works in both modes
            pointerEvents: 'none', // let the drop reach the zone underneath
            zIndex: 1,
          }}
        >
          <Typography variant="h2" component="p" color="primary">
            Drop the video to open it
          </Typography>
        </Box>
      )}
    </Box>
  )
}
