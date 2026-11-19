import type { IncomingMessage } from 'node:http'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Express runs on port 3000 while Vite runs on port 5173.
// If your server uses another PORT, start Vite with BACKEND_URL=http://localhost:<port>.
const backend = process.env.BACKEND_URL ?? 'http://localhost:3000'

// A browser asking for a *page* (typing a URL, refreshing) sends "Accept: text/html".
// A <video> tag or fetch() asking for the file doesn't. For page requests we answer
// with index.html, so React Router can show the page instead of Express.
export function sendPagesToReact(req: IncomingMessage): string | undefined {
  return req.headers.accept?.includes('text/html') ? '/index.html' : undefined
}

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': backend,
      '/thumbnail': backend,
      '/frame': backend,
      '/process': backend,
      '/results': backend,
      // The video files live at /videos/<file> on Express, but /videos is also our
      // video chooser page. A key starting with ^ is a regular expression: this one
      // only matches when a file name follows "/videos/", so /videos itself stays a
      // React page. The bypass sends page loads (like refreshing a future
      // /videos/<something> page) to React too; only file requests reach Express.
      // Express supports Range requests, so the browser can seek in the video.
      '^/videos/.+': { target: backend, bypass: sendPagesToReact },
    },
  },
})
