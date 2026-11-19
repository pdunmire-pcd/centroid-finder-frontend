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

// A realistic CSV for the 11-second, 25 fps mock video: the object moves in a
// loop, is lost between 4.0 s and 4.6 s, and jumps once at 7.0 s.
function buildMockCsv(): string {
  const rows: string[] = []
  for (let frame = 0; frame < 275; frame++) {
    const seconds = frame * 0.04
    let x = Math.round(960 + 500 * Math.cos(seconds / 2))
    let y = Math.round(540 + 300 * Math.sin(seconds / 2))
    if (seconds >= 4 && seconds < 4.6) {
      x = -1
      y = -1
    }
    if (frame === 175) x += 400 // one suspect jump
    rows.push(`${seconds.toFixed(3)},${x},${y}`)
  }
  return rows.join('\n')
}

describe('job results page', () => {
  beforeEach(() => {
    cy.intercept('GET', '/mock/result.csv', { body: buildMockCsv(), headers: { 'content-type': 'text/csv' } })
  })

  it('shows the settings, steps, video and actions for a finished job', () => {
    cy.visit('/jobs/mock-job-123')
    cy.contains('h1', 'bright_balloon_sample_video.mp4')
    cy.contains('#ff0000')
    cy.get('[data-cy="job-steps"]').should('contain', 'Results ready')
    cy.get('[data-cy="results-video"]').should('be.visible')
    cy.get('[data-testid="trajectory-canvas"]').should('have.prop', 'width', 1920)
    cy.get('[data-cy="download-csv"]').should('have.attr', 'href', '/mock/result.csv')
    cy.get('[data-cy="run-again"]')
      .should('have.attr', 'href', '/analyze/bright_balloon_sample_video.mp4?color=ff0000&threshold=120')
    cy.contains('nav[aria-label="Breadcrumb"] a', 'Jobs').should('have.attr', 'href', '/jobs')
  })

  it('shows summary tiles with numbers from the CSV', () => {
    cy.visit('/jobs/mock-job-123')
    cy.get('[data-cy="summary-tile"]').should('have.length', 6)
    cy.contains('[data-cy="summary-tile"]', 'Frames').find('[data-cy="summary-value"]').should('have.text', '275')
    // 15 frames between 4.0 s and 4.6 s have no match
    cy.contains('[data-cy="summary-tile"]', 'No-match frames').find('[data-cy="summary-value"]').should('have.text', '15')
    cy.get('[data-cy="summary-value"]').each((value) => {
      cy.wrap(value).invoke('text').should('match', /^[\d,.]+$/)
    })
  })

  it('shows the error step for a failed job', () => {
    cy.visit('/jobs/mock-job-122')
    cy.get('[data-cy="job-steps"]').should('contain', 'Failed').and('contain', 'Error processing video')
    cy.get('[data-cy="results-video"]').should('not.exist')
  })

  it('shows an error for an unknown job', () => {
    cy.visit('/jobs/does-not-exist')
    cy.contains('Could not load job does-not-exist')
  })
})
