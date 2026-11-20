// Takes a screenshot of every page at four widths in both themes, for the
// design log (docs/progress/design.md). It is not part of the normal E2E run
// (it lives outside cypress/e2e); run it on purpose with:
//
//   npx vite --mode mock --port 5186 --strictPort      (in another terminal)
//   npx cypress run --spec cypress/design/screenshots.cy.ts \
//     --config baseUrl=http://localhost:5186,specPattern=cypress/design/*.cy.ts \
//     --expose shotSet=after
//
// Cypress saves the pictures in cypress/screenshots (git-ignored); copy the
// ones you want to keep into docs/progress/design-screenshots/.

import { DESIGN_PAGES, THEMES, visitInTheme } from '../support/designPages'

const WIDTHS = [375, 768, 1280, 1920]
const HEIGHT = 900
const shotSet = String(Cypress.expose('shotSet') ?? 'after')

describe('design screenshots', () => {
  for (const page of DESIGN_PAGES) {
    for (const theme of THEMES) {
      it(`${page.name} (${theme})`, () => {
        for (const width of WIDTHS) {
          cy.viewport(width, HEIGHT)
          visitInTheme(page, theme)
          cy.wait(1000) // let thumbnails and the first video frame settle
          cy.screenshot(`${shotSet}/${page.name}-${theme}-${width}`, { capture: 'fullPage', overwrite: true })
        }
      })
    }
  }
})
