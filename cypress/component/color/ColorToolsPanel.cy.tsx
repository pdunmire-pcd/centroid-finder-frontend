import { useState } from 'react'
import { ColorToolsPanel } from '../../../src/components/color/ColorToolsPanel'
import { PROFILES_STORAGE_KEY } from '../../../src/hooks/useColorProfiles'
import { fillRect, solidFrame } from './frames'

// 20x20 white frame with a 6x6 salamander-colored animal at (4,4)-(9,9).
// Shown 400 px wide, so 1 frame pixel = 20 screen pixels.
function makeFrame() {
  return fillRect(solidFrame(20, 20, [255, 255, 255]), 4, 4, 6, 6, [0x66, 0x00, 0x05])
}

/** Holds the color and threshold like a page would. */
function Harness() {
  const [targetColor, setTargetColor] = useState('#ff0000')
  const [threshold, setThreshold] = useState(120)
  return (
    <div style={{ width: 400 }}>
      <ColorToolsPanel
        frame={makeFrame()}
        currentTime={0}
        filename="salamander1.mp4"
        targetColor={targetColor}
        threshold={threshold}
        onTargetColorChange={setTargetColor}
        onThresholdChange={setThreshold}
      />
    </div>
  )
}

describe('<ColorToolsPanel />', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
  })

  it('goes from a click to the exact request', () => {
    cy.mount(<Harness />)
    cy.get('[data-testid="request-preview"]').should('contain', 'targetColor=ff0000&threshold=120')

    cy.get('[data-testid="sampler-canvas"]').click(130, 130) // pixel (6, 6), inside the animal
    cy.contains('button', 'Use this color').click()
    cy.get('[data-testid="tracking-legend"]').should('contain', '#660005')

    // one sample: spread 0, margin 15 -> 0 + 15 + 1 = 16
    cy.get('[data-testid="suggested-threshold"]').should('have.text', '16')
    cy.contains('button', 'Apply').click()
    cy.get('[data-testid="request-preview"]').should(
      'have.text',
      'POST /process/salamander1.mp4?targetColor=660005&threshold=16',
    )
  })

  it('saves a profile to localStorage and loads it back after a remount', () => {
    cy.mount(<Harness />)
    cy.get('[data-testid="sampler-canvas"]').click(130, 130)
    cy.contains('button', 'Use this color').click()
    cy.get('input[placeholder="e.g. Ensatina on pink"]').type('Ensatina')
    cy.contains('button', 'Save').click()

    cy.get('[data-testid="profile-list"]').should('contain', 'Ensatina').and('contain', '#660005')
    cy.window().then((win) => {
      const saved = JSON.parse(win.localStorage.getItem(PROFILES_STORAGE_KEY) ?? '[]')
      expect(saved[0]).to.include({ name: 'Ensatina', targetColor: '660005', threshold: 120 })
      expect(saved[0].samples).to.have.length(1)
    })

    // a fresh mount starts at #ff0000 again; loading the profile restores it
    cy.mount(<Harness />)
    cy.get('[data-testid="tracking-legend"]').should('contain', '#ff0000')
    cy.get('[aria-label="Load profile Ensatina"]').click()
    cy.get('[data-testid="tracking-legend"]').should('contain', '#660005')
    cy.get('[data-testid="sample-row"]').should('have.length', 1)

    cy.get('[aria-label="Delete profile Ensatina"]').click()
    cy.contains('No saved profiles yet.')
  })
})
