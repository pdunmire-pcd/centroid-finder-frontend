import { ThemeProvider } from '@mui/material'
import { TrackTable } from '../../../src/components/results/TrackTable'
import { createAppTheme } from '../../../src/theme'
import type { TrackPoint } from '../../../src/types'

// 60 frames; frames 30-31 have no match, frame 50 is a suspect jump
const points: TrackPoint[] = Array.from({ length: 60 }, (_, i) => {
  const lost = i === 30 || i === 31
  return { seconds: i * 0.04, x: lost ? -1 : i, y: lost ? -1 : 2 * i }
})

function mountTable(currentIndex: number, onSeek = cy.stub().as('onSeek')) {
  cy.mount(
    <ThemeProvider theme={createAppTheme('light')}>
      <TrackTable points={points} suspectIndexes={[50]} currentIndex={currentIndex} onSeek={onSeek} />
    </ThemeProvider>,
  )
}

describe('<TrackTable />', () => {
  it('shows 25 rows per page and pages through the rest', () => {
    mountTable(0)
    cy.get('[data-cy="track-row"]').should('have.length', 25)
    cy.contains('1–25 of 60')
    cy.get('button[aria-label="Go to next page"]').click()
    cy.get('[data-cy="track-row"]').first().should('have.attr', 'data-frame', '25')
  })

  it('seeks when a row is clicked or Enter is pressed', () => {
    mountTable(0)
    cy.get('[data-cy="track-row"][data-frame="3"]').click()
    cy.get('@onSeek').should('have.been.calledWith', 0.12)
    cy.get('[data-cy="track-row"][data-frame="4"]').focus().type('{enter}')
    cy.get('@onSeek').should('have.been.calledWith', 0.16)
  })

  it('filters to flagged rows with notes', () => {
    mountTable(0)
    cy.get('[data-cy="flagged-only"] input').check()
    cy.get('[data-cy="track-row"]').should('have.length', 3)
    cy.get('[data-cy="track-row"]').eq(0).should('contain', 'No match')
    cy.get('[data-cy="track-row"]').eq(2).should('contain', 'Suspect jump')
  })

  it('jumps to the page with the current frame and marks it', () => {
    mountTable(55)
    cy.get('[data-cy="jump-to-current"]').click()
    cy.contains('51–60 of 60')
    cy.get('[data-cy="track-row"][data-frame="55"]').should('have.attr', 'aria-current', 'true')
  })
})
