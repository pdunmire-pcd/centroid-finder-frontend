import { ColorSampler } from '../../../src/components/color/ColorSampler'
import type { ColorSample } from '../../../src/types'

// extractedFrame.png is a lossless 1920x1080 PNG, so the browser decodes the
// same pixels as Java and Node. The expected colors below were read from it in
// Node with sharp: pixel (1185, 933) is rgb(162, 166, 41) and the median of
// the 9x9 square around it is rgb(161, 166, 41).
//
// Cypress rounds click positions to whole screen pixels, so we cut out the
// 40x40 square starting at (1165, 913) and show it 10x larger (400 px wide).
// Pixel (1185, 933) of the frame is then pixel (20, 20) of the crop, which is
// screen pixels 200-209: clicking at (205, 205) hits it exactly.

/** Decodes the fixture PNG into ImageData (no color conversion) and crops it. */
function loadFixtureFrame(): Cypress.Chainable<ImageData> {
  return cy.fixture('extractedFrame.png', null).then(async (bytes: ArrayBuffer) => {
    const bitmap = await createImageBitmap(new Blob([bytes]), { colorSpaceConversion: 'none' })
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bitmap, 0, 0)
    return ctx.getImageData(1165, 913, 40, 40)
  })
}

describe('<ColorSampler /> on a real frame', () => {
  const CLICK_X = 205
  const CLICK_Y = 205

  function mountWith(frame: ImageData, onChange: (samples: ColorSample[]) => void) {
    cy.mount(
      <div style={{ width: 400 }}>
        <ColorSampler frame={frame} currentTime={0} samples={[]} onSamplesChange={onChange} />
      </div>,
    )
  }

  it('a 1x1 click gives the exact pixel color of the fixture image', () => {
    loadFixtureFrame().then((frame) => {
      const onChange = cy.stub().as('onChange')
      mountWith(frame, onChange)
      cy.contains('button', '1×1').click()
      cy.get('[data-testid="sampler-canvas"]').click(CLICK_X, CLICK_Y)
      cy.get<sinon.SinonStub>('@onChange').then((stub) => {
        const [samples] = stub.firstCall.args as [ColorSample[]]
        expect(samples[0]).to.deep.include({ x: 20, y: 20, rgb: [162, 166, 41] })
      })
    })
  })

  it('a 9x9 click gives the median of the square around it', () => {
    loadFixtureFrame().then((frame) => {
      const onChange = cy.stub().as('onChange')
      mountWith(frame, onChange)
      cy.contains('button', '9×9').click()
      cy.get('[data-testid="sampler-canvas"]').click(CLICK_X, CLICK_Y)
      cy.get<sinon.SinonStub>('@onChange').then((stub) => {
        const [samples] = stub.firstCall.args as [ColorSample[]]
        expect(samples[0]).to.deep.include({ x: 20, y: 20, size: 9, rgb: [161, 166, 41] })
      })
    })
  })
})
