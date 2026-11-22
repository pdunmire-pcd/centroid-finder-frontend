describe('video processing', () => {
  beforeEach(() => {
    cy.visit('/preview/ensantina.mp4')
  })

  it('shows the original as a playable video', () => {
    cy.get('[data-cy="original-video"]')
      .should('have.prop', 'tagName', 'VIDEO')
      .and('have.attr', 'src', '/mock/videos/ensantina.mp4')
      .and('have.attr', 'controls')
  })

  it('starts processing and displays the CSV link', () => {
    cy.contains('Process Video with These Settings').click()

    cy.contains('Processing video…', { timeout: 10000 })
    cy.contains('Processing complete.', { timeout: 10000 })
    cy.contains('Download CSV')
      .should('have.attr', 'href', '/mock/result.csv')
  })
})