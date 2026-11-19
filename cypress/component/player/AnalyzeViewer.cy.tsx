import { AnalyzeViewer } from '../../../src/components/player/AnalyzeViewer'

const SRC = `${import.meta.env.BASE_URL}mock/sample.mp4`

/** Number of points in the "Trail: N points" text. */
function trailCount(text: string): number {
  return Number(text.replace(/\D/g, ''))
}

describe('<AnalyzeViewer />', () => {
  beforeEach(() => {
    cy.mount(<AnalyzeViewer src={SRC} targetColor="#ff0000" threshold={120} />)
    cy.get('[data-testid="current-time"]').should('contain', '0:11.00')
  })

  it('finds the red balloon in the first frame', () => {
    cy.get('[data-testid="centroid-info"]').should('contain', 'Centroid at (')
    cy.get<HTMLCanvasElement>('[data-testid="binarized-canvas"]')
      .should('have.prop', 'width', 640)
      .and('have.prop', 'height', 360)
  })

  it('records a trail while playing and clears it', () => {
    cy.get('[data-testid="trail-info"]').should('have.text', 'Trail: 0 points')
    cy.contains('button', 'Play').click()
    cy.get('[data-testid="trail-info"]').should(($p) => {
      expect(trailCount($p.text())).to.be.greaterThan(5)
    })
    cy.contains('button', 'Pause').click()

    cy.contains('button', 'Clear trail').click()
    cy.get('[data-testid="trail-info"]').should('have.text', 'Trail: 0 points')
  })

  it('does not record points while stepping', () => {
    cy.get('[data-testid="centroid-info"]').should('contain', 'Centroid at (')
    cy.get('[aria-label="Next frame"]').click()
    cy.get('[data-testid="frame-number"]').should('contain', 'Frame 1 ')
    cy.get('[data-testid="trail-info"]').should('have.text', 'Trail: 0 points')
  })
})
