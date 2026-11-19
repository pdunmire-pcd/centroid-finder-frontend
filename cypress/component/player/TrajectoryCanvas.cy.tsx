import { TrajectoryCanvas } from '../../../src/components/shared/TrajectoryCanvas'
import type { TrackPoint } from '../../../src/types'

// A 200x100 canvas shown at 400x200 on screen (twice as big), so clicks have
// to be converted from screen pixels to canvas pixels.
const POINTS: TrackPoint[] = [
  { seconds: 0, x: 20, y: 50 },
  { seconds: 1, x: 60, y: 50 },
  { seconds: 2, x: -1, y: -1 }, // no match: the line breaks here
  { seconds: 3, x: 140, y: 50 },
  { seconds: 4, x: 180, y: 50 },
]

function mountCanvas(onPointClick?: (point: TrackPoint) => void) {
  cy.mount(
    <div style={{ position: 'relative', width: 400, height: 200, background: '#000' }}>
      <TrajectoryCanvas width={200} height={100} points={POINTS} currentTime={4} onPointClick={onPointClick} />
    </div>,
  )
}

/** Alpha (0-255) of one canvas pixel. */
function alphaAt(canvas: HTMLCanvasElement, x: number, y: number): number {
  return canvas.getContext('2d')!.getImageData(x, y, 1, 1).data[3]
}

describe('<TrajectoryCanvas />', () => {
  it('fades older parts of the trail', () => {
    mountCanvas()
    cy.get<HTMLCanvasElement>('[data-testid="trajectory-canvas"]').should(($canvas) => {
      const oldPart = alphaAt($canvas[0], 40, 50) // between 0 s and 1 s
      const newPart = alphaAt($canvas[0], 160, 50) // between 3 s and 4 s
      expect(oldPart).to.be.greaterThan(0)
      expect(newPart).to.be.greaterThan(oldPart)
    })
  })

  it('breaks the line at no-match points', () => {
    mountCanvas()
    cy.get<HTMLCanvasElement>('[data-testid="trajectory-canvas"]').should(($canvas) => {
      expect(alphaAt($canvas[0], 160, 50)).to.be.greaterThan(0) // drawn part
      expect(alphaAt($canvas[0], 100, 50)).to.equal(0) // the gap
    })
  })

  it('lets clicks pass through without onPointClick', () => {
    mountCanvas()
    cy.get('[data-testid="trajectory-canvas"]').should('have.css', 'pointer-events', 'none')
  })

  it('reports the clicked point', () => {
    const onPointClick = cy.stub().as('pointClick')
    mountCanvas(onPointClick)
    cy.get('[data-testid="trajectory-canvas"]').should('have.css', 'pointer-events', 'auto')

    // canvas (140, 50) is screen (280, 100)
    cy.get('[data-testid="trajectory-canvas"]').click(282, 101)
    cy.get('@pointClick').should('have.been.calledOnceWith', POINTS[3])
  })

  it('ignores clicks far from any point', () => {
    const onPointClick = cy.stub().as('pointClick')
    mountCanvas(onPointClick)
    cy.get('[data-testid="trajectory-canvas"]').click(200, 20)
    cy.get('@pointClick').should('not.have.been.called')
  })
})
