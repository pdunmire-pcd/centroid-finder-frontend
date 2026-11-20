import { Box } from '@mui/material'

/** The id of the <main> element the skip link jumps to. */
export const MAIN_CONTENT_ID = 'main-content'

// "Skip to main content": hidden until it gets keyboard focus (the first Tab
// on any page), then it slides into the top-left corner. Pressing Enter moves
// focus into <main>, so keyboard users don't tab through the top bar on
// every page (WCAG 2.4.1 Bypass Blocks).
export function SkipLink() {
  return (
    <Box
      component="a"
      href={`#${MAIN_CONTENT_ID}`}
      data-cy="skip-link"
      onClick={(event) => {
        // Move focus ourselves: a plain #hash jump scrolls but some browsers
        // leave focus where it was. React Router doesn't use the hash here.
        event.preventDefault()
        const main = document.getElementById(MAIN_CONTENT_ID)
        main?.focus()
        main?.scrollIntoView()
      }}
      sx={{
        position: 'fixed',
        top: 8,
        left: 8,
        zIndex: (theme) => theme.zIndex.tooltip + 1,
        px: 2,
        py: 1.25,
        borderRadius: 999,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        fontWeight: 600,
        textDecoration: 'none',
        // Off screen until focused
        transform: 'translateY(-150%)',
        transition: 'transform 160ms ease',
        '&:focus, &:focus-visible': { transform: 'translateY(0)' },
      }}
    >
      Skip to main content
    </Box>
  )
}
