import { Link, useLocation } from 'react-router-dom'
import { AppBar, Box, IconButton, Tab, Tabs, Toolbar, Tooltip, Typography } from '@mui/material'
import { LogoMark } from './LogoMark'
import { ServerStatusBadge } from './ServerStatusBadge'
import { useColorMode } from './colorMode'
import { activeTab } from './nav'

export function TopBar() {
  const { pathname } = useLocation()
  const { mode, toggleMode } = useColorMode()
  const nextMode = mode === 'light' ? 'dark' : 'light'

  return (
    <AppBar position="sticky" sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar
        variant="dense"
        sx={{ gap: { xs: 1, sm: 2 }, minHeight: 56, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}
      >
        <Box
          component={Link}
          to="/videos"
          sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'inherit', textDecoration: 'none' }}
        >
          <LogoMark />
          <Typography variant="subtitle1" component="span" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
            Centroid Finder
          </Typography>
        </Box>

        {/* Tabs render as links, so they work with the keyboard and middle-click */}
        <Tabs
          value={activeTab(pathname)}
          aria-label="Main navigation"
          sx={{ minHeight: 56, order: { xs: 3, sm: 0 }, width: { xs: '100%', sm: 'auto' } }}
        >
          <Tab label="Videos" value="videos" component={Link} to="/videos" sx={{ minHeight: 56 }} />
          <Tab label="Jobs" value="jobs" component={Link} to="/jobs" sx={{ minHeight: 56 }} />
        </Tabs>

        <Box sx={{ flexGrow: 1 }} />

        <ServerStatusBadge />

        <Tooltip title={`Switch to ${nextMode} mode`}>
          <IconButton onClick={toggleMode} aria-label={`Switch to ${nextMode} mode`} size="small">
            {/* Simple text icons, so we don't need an icon package */}
            <Box component="span" aria-hidden="true" sx={{ fontSize: 18, lineHeight: 1, width: 20 }}>
              {mode === 'light' ? '☾' : '☀'}
            </Box>
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  )
}
