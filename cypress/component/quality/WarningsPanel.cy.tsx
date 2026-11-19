import { LiveStatsPanel } from '../../../src/components/quality/LiveStatsPanel'
import { WarningsPanel } from '../../../src/components/quality/WarningsPanel'
import type { FrameAnalysis } from '../../../src/centroid/engine'
import type { Warning } from '../../../src/types'

const EDGE: Warning = {
  code: 'touches-edge',
  message: 'The largest group touches the frame edge.',
  fix: 'Lower the threshold or sample the animal again.',
}
const NO_MATCH: Warning = {
  code: 'no-match',
  message: 'No pixels are within the threshold in this frame.',
  fix: 'Raise the threshold or sample the object again.',
}

describe('<WarningsPanel />', () => {
  it('says "Looks good" only when there are no warnings', () => {
    cy.mount(<WarningsPanel warnings={[]} />)
    cy.get('[data-testid="looks-good"]').should('contain', 'Looks good')
  })

  it('shows each warning with its message and fix, and no "Looks good"', () => {
    cy.mount(<WarningsPanel warnings={[EDGE, NO_MATCH]} />)

    cy.get('[data-testid="warning-touches-edge"]')
      .should('contain', 'touches the frame edge')
      .and('contain', 'Fix: Lower the threshold')
      .and('have.class', 'MuiAlert-colorWarning')
    cy.get('[data-testid="warning-no-match"]').should('have.class', 'MuiAlert-colorError')
    cy.get('[data-testid="looks-good"]').should('not.exist')
  })

  it('shows neither warnings nor "Looks good" before a frame is checked', () => {
    cy.mount(<WarningsPanel warnings={null} />)
    cy.contains('Waiting for a frame')
    cy.get('[data-testid="looks-good"]').should('not.exist')
  })
})

describe('<LiveStatsPanel />', () => {
  it('shows the stats of a frame', () => {
    const analysis: FrameAnalysis = {
      groups: [
        { size: 300, centroid: { x: 12, y: 34 } },
        { size: 150, centroid: { x: 90, y: 5 } },
      ],
      binary: new Uint8Array(100 * 100),
      width: 100,
      height: 100,
      matchingPixels: 450,
    }
    cy.mount(<LiveStatsPanel analysis={analysis} />)

    cy.get('[data-testid="stat-matching"]').should('have.text', '4.50%')
    cy.get('[data-testid="stat-groups"]').should('have.text', '2')
    cy.get('[data-testid="stat-centroid"]').should('have.text', '(12, 34), 300 px')
    cy.get('[data-testid="stat-ratio"]').should('have.text', '50%')
  })
})
