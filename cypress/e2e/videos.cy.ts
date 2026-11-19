// Runs against `npm run dev:mock`, so the videos come from src/api.ts mock data.
describe('videos page', () => {
  beforeEach(() => {
    cy.visit('/videos')
  })

  it('shows a card for every mock video with a status', () => {
    cy.get('[data-cy="video-card"]').should('have.length.at.least', 2)
    cy.get('[data-cy="video-card"]').first().find('[data-cy="video-status"]').should('exist')
    cy.contains('[data-cy="server-status"]', 'Mock data')
  })

  it('filters the cards by name', () => {
    cy.get('[data-cy="video-search"]').type('salamander')
    cy.get('[data-cy="video-card"]').each((card) => {
      cy.wrap(card).invoke('text').should('match', /salamander/i)
    })

    cy.get('[data-cy="video-search"]').clear().type('no-such-video')
    cy.get('[data-cy="video-card"]').should('not.exist')
    cy.get('[data-cy="videos-empty"]').should('contain', 'No videos match')
  })

  it('opens the Analyze page when a card is clicked', () => {
    cy.get('[data-cy="video-card"]').first().click()
    cy.location('pathname').should('match', /^\/analyze\/.+/)
  })

  it('opens a local file on /analyze/local', () => {
    cy.get('[data-cy="local-file-input"]').selectFile(
      { contents: Cypress.Buffer.from('not really a video'), fileName: 'clip.mp4', mimeType: 'video/mp4' },
      { force: true }, // the input is hidden behind the "Choose file" button
    )
    cy.location('pathname').should('eq', '/analyze/local')
  })

  it('rejects a file that is not a video', () => {
    cy.get('[data-cy="local-file-input"]').selectFile(
      { contents: Cypress.Buffer.from('hello'), fileName: 'notes.txt', mimeType: 'text/plain' },
      { force: true },
    )
    cy.contains('is not a video file')
    cy.location('pathname').should('eq', '/videos')
  })
})
