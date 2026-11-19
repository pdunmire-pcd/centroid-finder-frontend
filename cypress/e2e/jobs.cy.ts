// Runs against `npm run dev:mock`. The mock data (src/api.ts) has one "done"
// job and one "error" job.
describe('jobs page', () => {
  beforeEach(() => {
    cy.visit('/jobs')
  })

  it('lists the jobs with their settings', () => {
    cy.get('[data-cy="job-row"]').should('have.length.at.least', 2)
    cy.contains('[data-cy="job-row"]', 'mock-job-123').within(() => {
      cy.contains('#ff0000')
      cy.contains('Done')
    })
    // The Jobs tab is the active one
    cy.contains('[role="tab"]', 'Jobs').should('have.attr', 'aria-selected', 'true')
  })

  it('filters by status', () => {
    cy.get('[data-cy="job-filter-error"]').click()
    cy.get('[data-cy="job-filter-error"]').should('have.attr', 'aria-pressed', 'true')
    cy.get('[data-cy="job-row"]').each((row) => {
      cy.wrap(row).find('[data-cy="job-status"]').should('have.text', 'Error')
    })
    // Failed jobs show their error message
    cy.get('[data-cy="job-row"]').first().should('contain', 'Error processing video')

    cy.get('[data-cy="job-filter-done"]').click()
    cy.get('[data-cy="job-row"]').each((row) => {
      cy.wrap(row).find('[data-cy="job-status"]').should('have.text', 'Done')
    })

    cy.get('[data-cy="job-filter-processing"]').click()
    cy.contains('No jobs with this status.')

    cy.get('[data-cy="job-filter-all"]').click()
    cy.get('[data-cy="job-row"]').should('have.length.at.least', 2)
  })

  it('opens the results page of a job', () => {
    cy.contains('[data-cy="job-row"]', 'mock-job-123').contains('Results').click()
    cy.location('pathname').should('eq', '/jobs/mock-job-123')
  })
})
