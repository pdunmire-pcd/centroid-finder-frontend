import { ThemeProvider } from '@mui/material'
import { PositionChart } from '../../../src/components/results/PositionChart'
import { createAppTheme } from '../../../src/theme'
import type { TrackPoint } from '../../../src/types'

// 10 seconds at 25 fps, with no match between 2 s and 3 s
const points: TrackPoint[] = Array.from({ length: 250 }, (_, i) => {
  const seconds = i * 0.04
  const lost = seconds >= 2 && seconds < 3
  return { seconds, x: lost ? -1 : 100 + i, y: lost ? -1 : 300 - i }
})

describe('<PositionChart />', () => {
  it('draws both lines, a no-match band and the legend', () => {
    cy.mount(
      <ThemeProvider theme={createAppTheme('light')}>
        <PositionChart points={points} suspectIndexes={[10, 20]} currentTime={5} onSeek={() => {}} />
      </ThemeProvider>,
    )
    cy.get('.recharts-line').should('have.length', 2)
    cy.get('.recharts-reference-area').should('have.length', 1)
    cy.contains('Suspect jump (2)')
  })

  it('calls onSeek with the time under the mouse', () => {
    const onSeek = cy.stub().as('onSeek')
    cy.mount(
      <ThemeProvider theme={createAppTheme('dark')}>
        <PositionChart points={points} suspectIndexes={[]} currentTime={0} onSeek={onSeek} />
      </ThemeProvider>,
    )
    cy.get('.recharts-surface').trigger('mousemove', 'center')
    cy.get('.recharts-surface').click('center')
    cy.get('@onSeek').should('have.been.calledOnce')
    // The middle of a 0-10 s chart is around 5 s
    cy.get('@onSeek').its('firstCall.args.0').should('be.within', 3.5, 6.5)
  })
})
