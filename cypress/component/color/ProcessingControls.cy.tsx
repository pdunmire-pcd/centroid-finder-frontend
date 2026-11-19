import { ProcessingControls } from '../../../src/components/ProcessingControls'

function mount(onThresholdChange: (n: number) => void) {
  cy.mount(
    <ProcessingControls
      filename="salamander1.mp4"
      threshold={67}
      targetColor="#660005"
      onThresholdChange={onThresholdChange}
      onTargetColorChange={() => {}}
      onProcess={() => {}}
      isProcessing={false}
    />,
  )
}

describe('<ProcessingControls />', () => {
  it('labels the ends of the slider', () => {
    mount(() => {})
    cy.contains('Exact match')
    cy.contains('Any color')
    cy.get('input[aria-labelledby="threshold-label"]').should('have.attr', 'max', '442')
  })

  it('accepts a typed threshold and clamps it to 0-442', () => {
    const onThresholdChange = cy.stub().as('change')
    mount(onThresholdChange)

    cy.get('[data-testid="threshold-input"]').should('have.value', '67')
    // the field is controlled, so typing "9" after 67 sends 679 -> clamped to 442
    cy.get('[data-testid="threshold-input"]').type('9')
    cy.get('@change').should('have.been.calledWith', 442)
  })
})
