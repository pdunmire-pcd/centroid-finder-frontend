// Writes every axe violation (all impacts) for every page and theme to a JSON
// file, for the before/after table in docs/progress/design.md. Unlike
// cypress/e2e/a11y.cy.ts it never fails; it only reports. Run with:
//
//   npx cypress run --spec cypress/design/axe-report.cy.ts \
//     --config baseUrl=http://localhost:5186,specPattern=cypress/design/*.cy.ts \
//     --expose axeOut=docs/progress/design-axe-after.json

import 'cypress-axe'
import type { AxeResults } from 'axe-core'
import { DESIGN_PAGES, THEMES, visitInTheme } from '../support/designPages'

type Row = { page: string; theme: string; id: string; impact: string; nodes: number; help: string }

const out = String(Cypress.expose('axeOut') ?? 'cypress/axe-report.json')
const rows: Row[] = []

describe('axe report', () => {
  for (const page of DESIGN_PAGES) {
    for (const theme of THEMES) {
      it(`${page.name} (${theme})`, () => {
        visitInTheme(page, theme)
        cy.wait(500)
        cy.injectAxe()
        cy.window()
          .then((win) => (win as unknown as { axe: { run: () => Promise<AxeResults> } }).axe.run())
          .then((results) => {
            for (const v of results.violations) {
              rows.push({
                page: page.name,
                theme,
                id: v.id,
                impact: v.impact ?? 'unknown',
                nodes: v.nodes.length,
                help: v.help,
              })
            }
          })
      })
    }
  }

  after(() => {
    cy.writeFile(out, rows)
  })
})
