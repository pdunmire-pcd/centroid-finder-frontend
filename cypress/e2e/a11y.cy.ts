// Automated accessibility checks with axe-core (through cypress-axe).
// Runs against `npm run dev:mock`. Every page, in both themes, must have no
// "serious" or "critical" violations of WCAG 2.0/2.1/2.2 A and AA rules.
// axe finds roughly a third to a half of real problems; keyboard and screen
// reader checks by hand are still needed (see docs/progress/design.md).

import 'cypress-axe'
import type { Result } from 'axe-core'
import { DESIGN_PAGES, THEMES, visitInTheme } from '../support/designPages'

/** Prints each violation in the Cypress log, so a failure says what and where. */
function logViolations(violations: Result[]) {
  for (const violation of violations) {
    const targets = violation.nodes.map((node) => node.target.join(' ')).join(' | ')
    Cypress.log({
      name: `axe ${violation.impact}`,
      message: `${violation.id}: ${violation.help} (${violation.nodes.length}) ${targets}`,
    })
  }
}

const AXE_OPTIONS = {
  runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
}

describe('accessibility (axe)', () => {
  for (const page of DESIGN_PAGES) {
    for (const theme of THEMES) {
      it(`${page.name} has no serious or critical violations (${theme})`, () => {
        visitInTheme(page, theme)
        cy.injectAxe()
        cy.checkA11y(null, { ...AXE_OPTIONS, includedImpacts: ['serious', 'critical'] }, logViolations)
      })
    }
  }

  for (const theme of THEMES) {
    it(`analyze page with samples and the histogram open has no serious violations (${theme})`, () => {
      visitInTheme(DESIGN_PAGES[1], theme)
      // take a sample with the keyboard, then open the "how well..." panel
      cy.get('[data-testid="sampler-canvas"]').focus()
      cy.get('[data-testid="sampler-canvas"]').type('{enter}')
      cy.get('[data-testid="sample-list"]').should('exist')
      cy.contains('How well does this color separate the animal?').click()
      cy.get('[data-testid="distance-histogram"]').should('be.visible')
      cy.injectAxe()
      cy.checkA11y(null, { ...AXE_OPTIONS, includedImpacts: ['serious', 'critical'] }, logViolations)
    })
  }

  it('has a skip link that moves focus to the main content', () => {
    cy.visit('/jobs')
    cy.get('[data-cy="skip-link"]').focus()
    cy.get('[data-cy="skip-link"]').should('be.visible').click()
    cy.focused().should('have.attr', 'id', 'main-content')
  })

  it('has one h1 and the header, nav and main landmarks on every page', () => {
    for (const page of DESIGN_PAGES) {
      visitInTheme(page, 'light')
      cy.get('h1').should('have.length', 1)
      cy.get('header').should('have.length', 1)
      cy.get('nav[aria-label="Main"]').should('exist')
      cy.get('main#main-content').should('exist')
    }
  })
})
