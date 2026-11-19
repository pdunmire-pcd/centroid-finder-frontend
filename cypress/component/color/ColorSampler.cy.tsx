import { useState } from 'react'
import { ColorSampler } from '../../../src/components/color/ColorSampler'
import type { ColorSample, RgbTriple } from '../../../src/types'
import { setPixel, solidFrame } from './frames'

// A 20x20 frame of the salamander color #660005 with one bright "noise"
// pixel at (5, 5). The sampler is shown 400 px wide, so 1 frame pixel = 20
// screen pixels and clicking at (110, 110) hits the middle of pixel (5, 5).
const SALAMANDER: RgbTriple = [0x66, 0x00, 0x05]
const NOISE: RgbTriple = [255, 255, 255]

function makeFrame() {
  return setPixel(solidFrame(20, 20, SALAMANDER), 5, 5, NOISE)
}

/** Wraps the controlled sampler in real state, like a page would. */
function Harness({ frame, onChange }: { frame: ImageData; onChange: (s: ColorSample[]) => void }) {
  const [samples, setSamples] = useState<ColorSample[]>([])
  return (
    <div style={{ width: 400 }}>
      <ColorSampler
        frame={frame}
        currentTime={1.5}
        samples={samples}
        onSamplesChange={(next) => {
          setSamples(next)
          onChange(next)
        }}
      />
    </div>
  )
}

describe('<ColorSampler />', () => {
  it('clicking a known-color pixel with a 1x1 area gives exactly that color', () => {
    const onChange = cy.stub().as('onChange')
    cy.mount(<Harness frame={makeFrame()} onChange={onChange} />)

    cy.contains('button', '1×1').click()
    cy.get('[data-testid="sampler-canvas"]').click(30, 30) // pixel (1, 1)

    cy.get('@onChange').should('have.been.calledOnce')
    cy.get('[data-testid="sample-row"]').should('contain', '#660005').and('contain', 'rgb(102, 0, 5)')
    cy.get('[data-testid="sample-row"]').should('contain', '1.50 s').and('contain', '(1, 1)')
  })

  it('a 1x1 sample on the noise pixel picks up the noise', () => {
    cy.mount(<Harness frame={makeFrame()} onChange={() => {}} />)

    cy.contains('button', '1×1').click()
    cy.get('[data-testid="sampler-canvas"]').click(110, 110) // pixel (5, 5)

    cy.get('[data-testid="sample-row"]').should('contain', '#ffffff')
  })

  it('a 3x3 area takes the median, so one noisy pixel is ignored', () => {
    const onChange = cy.stub().as('onChange')
    cy.mount(<Harness frame={makeFrame()} onChange={onChange} />)

    cy.contains('button', '3×3').click()
    cy.get('[data-testid="sampler-canvas"]').click(110, 110) // pixel (5, 5)

    cy.get('[data-testid="sample-row"]').should('contain', '#660005').and('contain', '3×3')
    cy.get('@onChange').should('have.been.calledOnce')
    cy.get<sinon.SinonStub>('@onChange').then((stub) => {
      const [samples] = stub.firstCall.args as [ColorSample[]]
      expect(samples[0]).to.deep.equal({ seconds: 1.5, x: 5, y: 5, size: 3, rgb: SALAMANDER })
    })
  })

  it('removes a sample', () => {
    cy.mount(<Harness frame={makeFrame()} onChange={() => {}} />)

    cy.get('[data-testid="sampler-canvas"]').click(30, 30)
    cy.get('[data-testid="sampler-canvas"]').click(310, 310)
    cy.get('[data-testid="sample-row"]').should('have.length', 2)

    cy.get('[aria-label="Remove sample 1"]').click()
    cy.get('[data-testid="sample-row"]').should('have.length', 1).and('contain', '(15, 15)')
  })

  it('can take a sample with the keyboard only', () => {
    cy.mount(<Harness frame={makeFrame()} onChange={() => {}} />)

    // focus starts the cursor in the middle (10, 10); two lefts -> (8, 10)
    cy.get('[data-testid="sampler-canvas"]').focus()
    cy.get('[data-testid="sampler-canvas"]').type('{leftArrow}{leftArrow}{enter}')

    cy.get('[data-testid="sample-row"]').should('contain', '(8, 10)')
  })
})
