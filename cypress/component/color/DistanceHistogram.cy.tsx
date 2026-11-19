import { DistanceHistogram } from '../../../src/components/color/DistanceHistogram'
import { DistanceMap } from '../../../src/components/color/DistanceMap'
import { fillRect, solidFrame } from './frames'

// 10x10 frame: white background with a 2x2 salamander-colored "animal",
// so 4 of 100 pixels (4%) are exactly the target color.
function makeFrame() {
  return fillRect(solidFrame(10, 10, [255, 255, 255]), 3, 3, 2, 2, [0x66, 0x00, 0x05])
}

describe('<DistanceHistogram />', () => {
  it('draws the threshold line at the right place', () => {
    cy.mount(<DistanceHistogram frame={makeFrame()} targetColor="#660005" threshold={221} />)

    // the chart is 400 units wide and 221 is half of 442
    cy.get('[data-testid="threshold-line"]')
      .should('have.attr', 'x1', '200')
      .and('have.attr', 'data-threshold', '221')
    cy.contains('threshold 221')
  })

  it('moves the line when the threshold changes', () => {
    cy.mount(<DistanceHistogram frame={makeFrame()} targetColor="#660005" threshold={221} />).then(
      ({ rerender }) => {
        rerender(<DistanceHistogram frame={makeFrame()} targetColor="#660005" threshold={0} />)
      },
    )
    cy.get('[data-testid="threshold-line"]').should('have.attr', 'x1', '0')
  })

  it('reports the share of pixels left of the line', () => {
    cy.mount(<DistanceHistogram frame={makeFrame()} targetColor="#660005" threshold={67} />)
    cy.contains('About 4.0% of the frame is left of the line')
  })

  it('has one bar per bin and a working log-scale toggle', () => {
    cy.mount(<DistanceHistogram frame={makeFrame()} targetColor="#660005" threshold={67} bins={50} />)
    cy.get('[data-testid="distance-histogram"] rect').should('have.length', 50)

    // first bar holds the 4 animal pixels; the tallest bar (background) holds 96
    // linear: 4/96 of the plot height. log: log(5)/log(97) - much taller.
    cy.get('[data-testid="distance-histogram"] rect')
      .first()
      .invoke('attr', 'height')
      .then((logHeight) => {
        cy.contains('Log scale').click()
        cy.get('[data-testid="distance-histogram"] rect')
          .first()
          .invoke('attr', 'height')
          .should((linearHeight) => {
            expect(Number(linearHeight)).to.be.lessThan(Number(logHeight))
          })
      })
  })
})

describe('<DistanceMap />', () => {
  it('paints the target color white and the background black', () => {
    cy.mount(
      <div style={{ width: 200 }}>
        <DistanceMap frame={makeFrame()} targetColor="#660005" threshold={67} />
      </div>,
    )
    cy.get<HTMLCanvasElement>('[data-testid="distance-map"]')
      .should('have.prop', 'width', 10)
      .then(($canvas) => {
        const ctx = $canvas[0].getContext('2d')!
        expect(Array.from(ctx.getImageData(3, 3, 1, 1).data)).to.deep.equal([255, 255, 255, 255])
        expect(Array.from(ctx.getImageData(0, 0, 1, 1).data)).to.deep.equal([0, 0, 0, 255])
      })
  })
})
