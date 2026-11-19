describe('video processing', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('starts processing and displays the CSV link', () => {
    cy.intercept('POST', '/process/intro.mp4?*', {
      statusCode: 202,
      body: { jobId: 'test-job-1' },
    }).as('processVideo')

    cy.intercept('GET', '/process/test-job-1/status', {
      statusCode: 200,
      body: {
        status: 'done',
        result: '/results/test-job-1.csv',
      },
    }).as('jobStatus')

    cy.contains('Process Video with These Settings').click()

    cy.wait('@processVideo')
    cy.wait('@jobStatus')
    cy.contains('Processing complete.')
    cy.contains('Download CSV')
      .should('have.attr', 'href', '/results/test-job-1.csv')
  })
})