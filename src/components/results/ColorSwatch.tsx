import { Box, Stack, Typography } from '@mui/material'
import { monoFontFamily } from '../../theme'
import { toCssHex } from './format'

// A small square of the target color, followed by its hex code.
export function ColorSwatch({ color, showHex = true }: { color: string; showHex?: boolean }) {
  const hex = toCssHex(color)
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Box
        aria-hidden="true"
        sx={{
          width: 16,
          height: 16,
          borderRadius: 0.5,
          bgcolor: hex,
          border: 1,
          borderColor: 'divider',
          flexShrink: 0,
        }}
      />
      {showHex && (
        <Typography variant="body2" sx={{ fontFamily: monoFontFamily }}>
          {hex}
        </Typography>
      )}
    </Stack>
  )
}
