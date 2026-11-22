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

  it('switches view modes without reloading the video', () => {
    cy.get('[aria-label="Next frame"]').click()
    cy.get('[data-testid="frame-number"]').should('contain', 'Frame 1 ')
    // mark the <video> element so we can check it's the same one later
    cy.get('[data-testid="video"]').invoke('attr', 'data-marked', 'yes')

    cy.contains('button', 'Original').click()
    cy.get('[data-testid="binarized-canvas"]').should('not.exist')
    cy.get('[data-testid="crosshair-canvas"]').should('exist')

    cy.get('[aria-label="View mode"]').contains('button', 'Binarized').click()
    // the binarized canvas now sits over the video, and has been drawn again
    cy.get('[data-testid="video"]')
      .parent()
      .find('[data-testid="binarized-canvas"]')
      .should('have.prop', 'width', 640)

    cy.contains('button', 'Side by side').click()
    cy.get('[data-testid="binarized-canvas"]').should('have.prop', 'width', 640)
    cy.get('[data-testid="video"]').should('have.attr', 'data-marked', 'yes')
    cy.get('[data-testid="frame-number"]').should('contain', 'Frame 1 ')
  })

  it('does not record points while stepping', () => {
    cy.get('[data-testid="centroid-info"]').should('contain', 'Centroid at (')
    cy.get('[aria-label="Next frame"]').click()
    cy.get('[data-testid="frame-number"]').should('contain', 'Frame 1 ')
    cy.get('[data-testid="trail-info"]').should('have.text', 'Trail: 0 points')
  })
})
