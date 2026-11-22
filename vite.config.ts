import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Express runs on port 3000 while Vite runs on port 5173.
const backend = 'http://localhost:3000'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': backend,
      '/thumbnail': backend,
      // Regex so only /video/<file> is proxied, not the /videos page route
      '^/video/': backend,
      '/process': backend,
      '/results': backend,
    },
  },
})
