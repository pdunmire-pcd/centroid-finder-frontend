import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    // Only pick up component specs, not the e2e specs in cypress/e2e
    specPattern: 'cypress/component/**/*.cy.{ts,tsx}',
  },
})
