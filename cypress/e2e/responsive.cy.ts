// Layout checks from a 320 px phone to a 2560 px screen (runs against
// `npm run dev:mock`). The page must never scroll sideways (WCAG 1.4.10
// Reflow): wide content such as tables scrolls inside its own box instead.

import { DESIGN_PAGES, visitInTheme } from '../support/designPages'

const WIDTHS = [320, 375, 768, 1024, 1440, 2560]

describe('responsive layout', () => {
  for (const page of DESIGN_PAGES) {
    it(`${page.name} never scrolls sideways, from 320 to 2560 px`, () => {
      for (const width of WIDTHS) {
        cy.viewport(width, 900)
        visitInTheme(page, 'light')
        cy.document().should((doc) => {
          const root = doc.documentElement
          // scrollWidth > clientWidth would mean a horizontal scrollbar
          expect(root.scrollWidth, `page width at ${width} px`).to.be.at.most(root.clientWidth)
        })
      }
    })
  }

  it('keeps the content a readable width on a 2560 px screen', () => {
    cy.viewport(2560, 1200)
    visitInTheme(DESIGN_PAGES[3], 'light') // job results: the widest page
    cy.get('main').invoke('outerWidth').should('be.at.most', 1536)
  })

  it('stacks the Analyze page on a phone and puts the panels side by side on a laptop', () => {
    const analyze = DESIGN_PAGES[1]

    cy.viewport(375, 800)
    visitInTheme(analyze, 'light')
    // the binarized view is below the video, not next to it
    cy.get('[data-testid="video"]').then(($video) => {
      cy.get('[data-testid="binarized-canvas"]').should(($canvas) => {
        expect($canvas[0].getBoundingClientRect().top).to.be.greaterThan($video[0].getBoundingClientRect().bottom)
      })
    })

    cy.viewport(1280, 900)
    visitInTheme(analyze, 'light')
    cy.get('[data-testid="video"]').then(($video) => {
      cy.get('[data-testid="binarized-canvas"]').should(($canvas) => {
        expect($canvas[0].getBoundingClientRect().left).to.be.greaterThan($video[0].getBoundingClientRect().right)
      })
    })
  })
})
