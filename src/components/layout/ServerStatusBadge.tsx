import { useEffect, useState } from 'react'
import { Box, Tooltip, Typography } from '@mui/material'
import { getHealth, isMockMode } from '../../api'

type ServerState = 'checking' | 'online' | 'offline' | 'mock'

const POLL_MS = 30_000

const LABELS: Record<ServerState, string> = {
  checking: 'Checking server…',
  online: 'Server online',
  offline: 'Offline',
  mock: 'Mock data',
}

const HELP: Record<ServerState, string> = {
  checking: 'Asking the server if it is running',
  online: 'The Express server answered the health check',
  offline: 'The Express server did not answer. Is it running on port 3000?',
  mock: 'Running with fake data (npm run dev:mock). No server needed.',
}

// Small colored dot + label in the top bar. Checks the server every 30 seconds.
export function ServerStatusBadge() {
  const [state, setState] = useState<ServerState>(isMockMode() ? 'mock' : 'checking')

  useEffect(() => {
    if (isMockMode()) return // nothing to check

    let ignore = false
    const check = () => {
      getHealth()
        .then((health) => {
          if (!ignore) setState(health.ok ? 'online' : 'offline')
        })
        .catch(() => {
          if (!ignore) setState('offline')
        })
    }

    check() // check right away, then every 30 s
    const interval = window.setInterval(check, POLL_MS)
    return () => {
      ignore = true
      window.clearInterval(interval)
    }
  }, [])

  const dotColor = {
    checking: 'text.disabled',
    online: 'success.main',
    offline: 'error.main',
    mock: 'warning.main',
  }[state]

  return (
    <Tooltip title={HELP[state]}>
      {/* role="status" makes screen readers announce changes */}
      <Box
        role="status"
        data-cy="server-status"
        tabIndex={0}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.25,
          py: 0.5,
          border: 1,
          borderColor: 'divider',
          borderRadius: 999,
          whiteSpace: 'nowrap',
        }}
      >
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: dotColor }} />
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {LABELS[state]}
        </Typography>
      </Box>
    </Tooltip>
  )
}
