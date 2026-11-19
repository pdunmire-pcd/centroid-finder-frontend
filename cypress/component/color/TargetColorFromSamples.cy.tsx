import { TargetColorFromSamples } from '../../../src/components/color/TargetColorFromSamples'
import type { ColorSample } from '../../../src/types'

function sample(rgb: [number, number, number]): ColorSample {
  return { seconds: 0, x: 0, y: 0, size: 5, rgb }
}

describe('<TargetColorFromSamples />', () => {
  it('asks for samples when there are none', () => {
    cy.mount(<TargetColorFromSamples samples={[]} targetColor="#ff0000" onUseColor={() => {}} />)
    cy.contains('Take at least one sample')
  })

  it('shows the average color and spread, and uses it on click', () => {
    const onUseColor = cy.stub().as('onUseColor')
    // average of (100,0,0) and (110,0,10) is (105,0,5); each is ~7.1 away from it
    cy.mount(
      <TargetColorFromSamples
        samples={[sample([100, 0, 0]), sample([110, 0, 10])]}
        targetColor="#ff0000"
        onUseColor={onUseColor}
      />,
    )

    cy.get('[data-testid="mean-color"]').should('have.text', '#690005')
    cy.contains('Spread: 7.1')
    cy.get('[data-testid="spread-words"]').should('contain', 'Very consistent')
    cy.contains('button', 'Use this color').click()
    cy.get('@onUseColor').should('have.been.calledOnceWith', '#690005')
  })

  it('disables the button when the average is already the target', () => {
    cy.mount(
      <TargetColorFromSamples samples={[sample([105, 0, 5])]} targetColor="#690005" onUseColor={() => {}} />,
    )
    cy.contains('button', 'This is the tracking color').should('be.disabled')
  })
})
