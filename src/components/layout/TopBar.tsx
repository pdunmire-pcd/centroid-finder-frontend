import { Link, useLocation } from 'react-router-dom'
import { AppBar, Box, IconButton, Tab, Tabs, Toolbar, Tooltip, Typography } from '@mui/material'
import { headingFontFamily } from '../../theme'
import { LogoMark } from './LogoMark'
import { ServerStatusBadge } from './ServerStatusBadge'
import { useColorMode } from './colorMode'
import { activeTab } from './nav'

// Simple line icons for the mode toggle, so we don't need an icon package.
function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </svg>
  )
}

export function TopBar() {
  const { pathname } = useLocation()
  const { mode, toggleMode } = useColorMode()
  const nextMode = mode === 'light' ? 'dark' : 'light'

  return (
    // AppBar renders a <header> element (the "banner" landmark)
    <AppBar position="sticky" sx={{ borderBottom: 1, borderColor: 'divider' }} data-cy="top-bar">
      <Toolbar
        disableGutters
        sx={{
          maxWidth: 1536, // lines up with the page content below
          width: '100%',
          mx: 'auto',
          px: { xs: 2, sm: 3, md: 4 },
          columnGap: { xs: 1, sm: 2.5 },
          minHeight: { xs: 56, sm: 64 },
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          rowGap: 0.5,
          pt: { xs: 0.5, sm: 0 },
        }}
      >
        <Box
          component={Link}
          to="/videos"
          aria-label="Centroid Finder, go to videos"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            color: 'inherit',
            textDecoration: 'none',
            borderRadius: 2,
            minHeight: 44,
          }}
        >
          <LogoMark />
          <Typography
            component="span"
            sx={{ fontFamily: headingFontFamily, fontSize: { xs: '1.1rem', sm: '1.2rem' }, fontWeight: 500, whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}
          >
            Centroid Finder
          </Typography>
        </Box>

        {/* Tabs render as links, so they work with the keyboard and middle-click */}
        {/* On phones (xs) the bar wraps into two rows: logo + mode toggle on
            top, the tabs and the server badge below. `order` moves them there
            visually; the reading (Tab) order stays the same as the code. */}
        <Box component="nav" aria-label="Main" sx={{ order: { xs: 4, sm: 0 }, flex: { xs: '1 1 auto', sm: '0 0 auto' } }}>
          <Tabs value={activeTab(pathname)} aria-label="Main navigation" sx={{ minHeight: 48 }}>
            <Tab label="Videos" value="videos" component={Link} to="/videos" sx={{ minHeight: 48, minWidth: 72 }} />
            <Tab label="Jobs" value="jobs" component={Link} to="/jobs" sx={{ minHeight: 48, minWidth: 72 }} />
          </Tabs>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ order: { xs: 5, sm: 0 } }}>
          <ServerStatusBadge />
        </Box>

        <Tooltip title={`Switch to ${nextMode} mode`}>
          <IconButton
            onClick={toggleMode}
            aria-label={`Switch to ${nextMode} mode`}
            sx={{ order: { xs: 3, sm: 0 }, width: 40, height: 40, color: 'text.secondary', border: 1, borderColor: 'divider' }}
          >
            {mode === 'light' ? <MoonIcon /> : <SunIcon />}
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  )
}
