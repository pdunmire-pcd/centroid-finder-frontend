import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Our Express server runs on port 3000 and Vite runs on 5173.
// The proxy sends these paths to Express, so the frontend can just call fetch("/api/videos")
// and the browser treats it as the same site (no CORS setup needed).
// /videos is NOT proxied: that's our Video Chooser page, so refreshing it must stay in React.
const backend = 'http://localhost:3000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': backend,
      '/thumbnail': backend,
      '/process': backend,
      '/results': backend,
    },
  },
})
