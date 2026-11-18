import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/process': 'http://localhost:3000',
      '/thumbnail': 'http://localhost:3000',
      '/results': 'http://localhost:3000',
    },
  },
})