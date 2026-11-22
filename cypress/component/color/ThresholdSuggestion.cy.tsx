import { ThresholdSuggestion } from '../../../src/components/color/ThresholdSuggestion'
import type { ColorSample } from '../../../src/types'

function sample(rgb: [number, number, number]): ColorSample {
  return { seconds: 0, x: 0, y: 0, size: 5, rgb }
}

// average (105,0,5), furthest sample 7.07 away.
// margin 15: ceil(7.07 + 15) + 1 = 23 + 1 = 24
const SAMPLES = [sample([100, 0, 0]), sample([110, 0, 10])]

describe('<ThresholdSuggestion />', () => {
  it('suggests furthest distance + margin + 1 and applies it', () => {
    const onApply = cy.stub().as('onApply')
    cy.mount(<ThresholdSuggestion samples={SAMPLES} targetColor="#690005" threshold={120} onApply={onApply} />)

    cy.get('[data-testid="suggested-threshold"]').should('have.text', '24')
    cy.contains('Current: 120')
    cy.get('[data-testid="threshold-explanation"]').should('contain', '7.1').and('contain', 'margin of 15')
    cy.contains('button', 'Apply').click()
    cy.get('@onApply').should('have.been.calledOnceWith', 24)
  })

  it('changes the suggestion when the margin slider moves', () => {
    cy.mount(<ThresholdSuggestion samples={SAMPLES} targetColor="#690005" threshold={120} onApply={() => {}} />)

    // keyboard on the slider: each right arrow adds 1 to the margin
    cy.get('input[aria-labelledby="margin-label"]').focus()
    cy.get('input[aria-labelledby="margin-label"]').type('{rightArrow}{rightArrow}{rightArrow}')
    cy.contains('Safety margin: 18')
    cy.get('[data-testid="suggested-threshold"]').should('have.text', '27')
  })

  it('reminds the user when the target is not the average color', () => {
    cy.mount(<ThresholdSuggestion samples={SAMPLES} targetColor="#ff0000" threshold={120} onApply={() => {}} />)
    cy.contains('assumes the average color (#690005)')
  })

  it('disables Apply when the threshold already matches', () => {
    cy.mount(<ThresholdSuggestion samples={SAMPLES} targetColor="#690005" threshold={24} onApply={() => {}} />)
    cy.contains('button', 'Apply').should('be.disabled')
  })
})
