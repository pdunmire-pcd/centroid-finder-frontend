import { BinarizedPreview } from '../../src/components/BinarizedPreview'

// extractedFrame.png is a 1920x1080 lossless PNG, so the browser decodes it to
// exactly the same pixels as Java and Node. The expected numbers below come
// from running the same TypeScript pipeline on it in Node (decoded by sharp).

const SRC = '/thumbnail/extractedFrame.png'

describe('<BinarizedPreview />', () => {
  beforeEach(() => {
    cy.intercept('GET', SRC, { fixture: 'extractedFrame.png' }).as('thumbnail')
  })

  it('draws the binarized frame at full size', () => {
    cy.mount(<BinarizedPreview imageSrc={SRC} targetColor="#ffa200" threshold={120} />)
    cy.wait('@thumbnail')

    cy.get('[data-testid="binarized-canvas"]')
      .should('be.visible')
      .and('have.prop', 'width', 1920)
      .and('have.prop', 'height', 1080)
  })

  it('finds the same largest group as the Java logic', () => {
    cy.mount(<BinarizedPreview imageSrc={SRC} targetColor="#ffa200" threshold={120} />)

    cy.get('[data-testid="centroid-info"]').should(
      'have.text',
      'Largest group: 41070 px at (1185, 933)',
    )
  })

  it('only draws black and white pixels (plus the dot)', () => {
    cy.mount(<BinarizedPreview imageSrc={SRC} targetColor="#ffa200" threshold={120} />)
    cy.get('[data-testid="centroid-info"]').should('contain', 'Largest group')

    cy.get<HTMLCanvasElement>('[data-testid="binarized-canvas"]').then(($canvas) => {
      const ctx = $canvas[0].getContext('2d')!
      // top-left corner, far away from the dot
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
      expect([0, 255]).to.include(r)
      expect(g).to.equal(r)
      expect(b).to.equal(r)
      expect(a).to.equal(255)
    })
  })

  it('updates live when the threshold changes', () => {
    cy.mount(
      <BinarizedPreview imageSrc={SRC} targetColor="#ffa200" threshold={120} />,
    ).then(({ rerender }) => {
      cy.get('[data-testid="centroid-info"]').should('contain', '41070 px')
      rerender(<BinarizedPreview imageSrc={SRC} targetColor="#ffa200" threshold={50} />)
    })

    cy.get('[data-testid="centroid-info"]').should(
      'have.text',
      'No matching pixels at this threshold',
    )
  })

  it('updates live when the color changes', () => {
    cy.mount(
      <BinarizedPreview imageSrc={SRC} targetColor="#ffa200" threshold={120} />,
    ).then(({ rerender }) => {
      cy.get('[data-testid="centroid-info"]').should('contain', '41070 px')
      rerender(<BinarizedPreview imageSrc={SRC} targetColor="#0000ff" threshold={120} />)
    })

    cy.get('[data-testid="centroid-info"]').should('not.contain', '41070 px')
  })

  it('shows an error when the image cannot be loaded', () => {
    cy.intercept('GET', '/thumbnail/missing.png', { statusCode: 404 })
    cy.mount(
      <BinarizedPreview imageSrc="/thumbnail/missing.png" targetColor="#ffa200" threshold={120} />,
    )

    cy.contains('Could not load image (status 404)')
  })
})
