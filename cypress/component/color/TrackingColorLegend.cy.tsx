import { TrackingColorLegend } from '../../../src/components/color/TrackingColorLegend'

describe('<TrackingColorLegend />', () => {
  it('shows the swatch, hex, RGB and threshold', () => {
    cy.mount(<TrackingColorLegend targetColor="#660005" threshold={67} />)
    cy.get('[data-testid="tracking-legend"]')
      .should('contain', '#660005')
      .and('contain', 'rgb(102, 0, 5)')
      .and('contain', 'threshold 67')
      .and('have.attr', 'aria-label', 'Tracking color #660005, threshold 67')
  })

  it('can be positioned over a video by the parent', () => {
    cy.mount(
      <div style={{ position: 'relative', width: 300, height: 200 }}>
        <TrackingColorLegend
          targetColor="#660005"
          threshold={67}
          sx={{ position: 'absolute', top: 8, left: 8 }}
        />
      </div>,
    )
    cy.get('[data-testid="tracking-legend"]').should('have.css', 'position', 'absolute')
  })
})
