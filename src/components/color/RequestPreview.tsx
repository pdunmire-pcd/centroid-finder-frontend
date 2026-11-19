import { Box, Button, Typography } from '@mui/material'
import { useState } from 'react'
import { buildProcessRequest } from './colorUtils'

export type RequestPreviewProps = {
  filename: string
  /** e.g. "#660005" */
  targetColor: string
  threshold: number
}

type CopyState = 'idle' | 'copied' | 'failed'

/**
 * Shows the exact API call "Process" will send, so the user can see (and
 * copy into a notebook or a bug report) which settings were used.
 */
export function RequestPreview({ filename, targetColor, threshold }: RequestPreviewProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const request = buildProcessRequest(filename, targetColor, threshold)

  async function copy() {
    try {
      await navigator.clipboard.writeText(request)
      setCopyState('copied')
    } catch {
      // the clipboard can be blocked (e.g. page not focused or not https)
      setCopyState('failed')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Box
          component="code"
          data-testid="request-preview"
          sx={{
            flex: 1,
            minWidth: 0,
            p: 1,
            borderRadius: 1,
            bgcolor: 'grey.100',
            fontSize: 13,
            overflowWrap: 'anywhere',
          }}
        >
          {request}
        </Box>
        <Button size="small" variant="outlined" onClick={copy} aria-label="Copy API request">
          Copy
        </Button>
      </Box>
      {/* aria-live makes screen readers announce the result of copying */}
      <Typography variant="caption" color="text.secondary" aria-live="polite" sx={{ display: 'block', minHeight: 20 }}>
        {copyState === 'copied' && 'Copied to the clipboard.'}
        {copyState === 'failed' && 'Could not copy. Select the text and copy it by hand.'}
      </Typography>
    </Box>
  )
}
