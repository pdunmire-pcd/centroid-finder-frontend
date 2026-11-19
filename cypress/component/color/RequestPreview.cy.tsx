import { RequestPreview } from '../../../src/components/color/RequestPreview'

describe('<RequestPreview />', () => {
  it('shows the exact Process request', () => {
    cy.mount(<RequestPreview filename="salamander1.mp4" targetColor="#660005" threshold={67} />)
    cy.get('[data-testid="request-preview"]').should(
      'have.text',
      'POST /process/salamander1.mp4?targetColor=660005&threshold=67',
    )
  })

  it('encodes spaces in the filename like the real request', () => {
    cy.mount(<RequestPreview filename="my video.mp4" targetColor="#ffa200" threshold={120} />)
    cy.get('[data-testid="request-preview"]').should('contain', '/process/my%20video.mp4?')
  })

  it('copies the request to the clipboard', () => {
    cy.mount(<RequestPreview filename="salamander1.mp4" targetColor="#660005" threshold={67} />)
    // replace the real clipboard so the test does not depend on browser permissions
    cy.window().then((win) => {
      cy.stub(win.navigator.clipboard, 'writeText').as('writeText').resolves()
    })

    cy.contains('button', 'Copy').click()
    cy.get('@writeText').should(
      'have.been.calledOnceWith',
      'POST /process/salamander1.mp4?targetColor=660005&threshold=67',
    )
    cy.contains('Copied to the clipboard.')
  })

  it('says so when copying fails', () => {
    cy.mount(<RequestPreview filename="a.mp4" targetColor="#660005" threshold={67} />)
    cy.window().then((win) => {
      cy.stub(win.navigator.clipboard, 'writeText').rejects(new Error('blocked'))
    })
    cy.contains('button', 'Copy').click()
    cy.contains('Could not copy')
  })
})
