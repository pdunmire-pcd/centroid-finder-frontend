describe('video processing', () => {
  beforeEach(() => {
    cy.visit('/preview/demo.mp4')
  })

  it('starts processing and displays the CSV link', () => {
    cy.contains('Process Video with These Settings').click()

    cy.contains('Processing video…', { timeout: 10000 })
    cy.contains('Processing complete.', { timeout: 10000 })
    cy.contains('Download CSV')
      .should('have.attr', 'href', '/mock/result.csv')
  })
})