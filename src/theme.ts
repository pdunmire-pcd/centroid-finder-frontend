import { createTheme } from '@mui/material'

// One place for colors and shapes, so every page looks consistent
export const theme = createTheme({
  palette: {
    primary: { main: '#2e7d32' },
    secondary: { main: '#ff8f00' },
    background: { default: '#f5f7f5' },
  },
  shape: { borderRadius: 10 },
})
