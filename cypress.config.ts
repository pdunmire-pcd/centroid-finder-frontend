import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    setupNodeEvents(on) {
      // Headless Electron opens a 1280 x 720 window, which crops screenshots of
      // wider viewports (the design screenshots go up to 1920 px). A bigger
      // window changes nothing else: cy.viewport still sets the page size.
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'electron') {
          launchOptions.preferences.width = 2000
          launchOptions.preferences.height = 1200
        }
        return launchOptions
      })
    },
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
