import { Alert, AlertTitle, Stack, Typography } from '@mui/material'
import type { Warning } from '../../types'
import { warningSeverity } from './qualityUtils'

export type WarningsPanelProps = {
  /** from checkFrameQuality; null = no frame analysed yet */
  warnings: Warning[] | null
}

/**
 * Lists the problems the quality checks found, each with what to do about it.
 * "Looks good" is only shown when a frame was checked and nothing was found.
 */
export function WarningsPanel({ warnings }: WarningsPanelProps) {
  if (warnings === null) {
    return (
      <Typography variant="body2" color="text.secondary">
        Waiting for a frame to check…
      </Typography>
    )
  }

  if (warnings.length === 0) {
    return (
      <Alert severity="success" data-testid="looks-good">
        Looks good: the quality checks found no problems in this frame.
      </Alert>
    )
  }

  return (
    <Stack spacing={1} data-testid="warnings">
      {warnings.map((warning) => (
        <Alert key={warning.code} severity={warningSeverity(warning.code)} data-testid={`warning-${warning.code}`}>
          <AlertTitle>{warning.message}</AlertTitle>
          Fix: {warning.fix}
        </Alert>
      ))}
    </Stack>
  )
}
