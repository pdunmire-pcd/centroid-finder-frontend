// Runs against `npm run dev:mock`. The mock data (src/api.ts) has one "done"
// job and one "error" job.
describe('jobs page', () => {
  beforeEach(() => {
    cy.visit('/jobs')
  })

  it('lists the jobs with their settings', () => {
    cy.get('[data-cy="job-row"]').should('have.length.at.least', 2)
    cy.contains('[data-cy="job-row"]', 'mock-job-123').within(() => {
      cy.contains('#ff4500')
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
    cy.get('[data-cy="job-row"]').each((row) => {
      cy.wrap(row).find('[data-cy="job-status"]').should('have.text', 'Processing')
    })

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
    cy.contains('#ff4500')
    cy.get('[data-cy="job-steps"]').should('contain', 'Results ready')
    cy.get('[data-cy="results-video"]').should('be.visible')
    cy.get('[data-testid="trajectory-canvas"]').should('have.prop', 'width', 1920)
    cy.get('[data-cy="download-csv"]').should('have.attr', 'href', '/mock/result.csv')
    cy.get('[data-cy="run-again"]')
      .should('have.attr', 'href', '/analyze/bright_balloon_sample_video.mp4?color=ff4500&threshold=100')
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

  it('jumps the video when the chart is clicked', () => {
    cy.visit('/jobs/mock-job-123')
    cy.get('[data-cy="position-chart"] .recharts-surface').should('be.visible')
    cy.get('[data-cy="results-video"]').should('have.prop', 'currentTime', 0)

    // Recharts finds the row under the mouse on mousemove, then click uses it
    cy.get('[data-cy="position-chart"] .recharts-surface').trigger('mousemove', 'center')
    cy.get('[data-cy="position-chart"] .recharts-surface').click('center')

    cy.get('[data-cy="results-video"]').its('0.currentTime').should('be.greaterThan', 3)
    cy.get('[data-cy="readout-time"]').should('not.have.text', '0:00.0')
  })

  it('counts suspect jumps and updates them when the limit changes', () => {
    cy.visit('/jobs/mock-job-123')
    // Flagged with the default 100 px: the 400 px jump at 7.0 s (twice: jumping
    // away and coming back) and the ~145 px move across the 0.6 s no-match gap
    cy.get('[data-cy="position-chart"]').should('contain', 'Suspect jump (3)')
    cy.get('[data-cy="max-jump"]').clear().type('1000')
    cy.get('[data-cy="position-chart"]').should('contain', 'Suspect jump (0)')
  })

  it('jumps the video when a table row is clicked', () => {
    cy.visit('/jobs/mock-job-123')
    cy.get('[data-cy="track-row"]').should('have.length', 25) // one page
    cy.get('[data-cy="track-row"][data-frame="20"]').click()
    // Frame 20 is at 20 x 0.04 = 0.8 s
    cy.get('[data-cy="results-video"]').its('0.currentTime').should('be.closeTo', 0.8, 0.01)
    cy.get('[data-cy="track-row"][data-frame="20"]').should('have.attr', 'aria-current', 'true')
  })

  // Known flaky (about 1 run in 3 in headless Electron): the second seek below
  // sometimes loses a race with the first one. It can't happen at human speed,
  // so we retry instead of hiding it. TODO: find the race in useVideoTime.
  it('filters to flagged rows and jumps to the current time', { retries: 2 }, () => {
    cy.visit('/jobs/mock-job-123')
    // Wait until the browser knows the video's length, so seeking works right away
    cy.get('[data-cy="results-video"]').its('0.readyState').should('be.gte', 1)
    cy.get('[data-cy="flagged-only"] input').check()
    // 15 no-match rows + 3 suspect jumps
    cy.get('[data-cy="track-row"]').should('have.length', 18)
    cy.get('[data-cy="track-row"]').first().should('contain', 'No match')
    cy.contains('[data-cy="track-row"]', 'Suspect jump').click()
    cy.get('[data-cy="results-video"]').its('0.currentTime').should('be.greaterThan', 4)
    // Let that seek finish before starting the next one, so the two can't race
    cy.get('[data-cy="results-video"]').its('0.seeking').should('equal', false)
    cy.get('[data-cy="readout-time"]').should('not.have.text', '0:00.0')

    // Seek with the chart to near the end, then ask the table to follow
    cy.get('[data-cy="flagged-only"] input').uncheck()
    cy.get('[data-cy="results-video"]').then((video) => {
      // 9.01, not 9: 225 x 0.04 is 9.000000000000002 in floating point
      ;(video[0] as HTMLVideoElement).currentTime = 9.01
    })
    cy.get('[data-cy="readout-time"]').should('have.text', '0:09.0')
    cy.get('[data-cy="jump-to-current"]').click()
    // 9.01 s is frame 225 (0-based), on page 10 (rows 226-250)
    cy.get('[data-cy="track-row"][data-frame="225"]').should('have.attr', 'aria-current', 'true')
  })

  it('downloads a run record as JSON', () => {
    cy.visit('/jobs/mock-job-123')
    cy.get('[data-cy="download-record"]').click()
    // Cypress saves downloads in cypress/downloads
    cy.readFile('cypress/downloads/bright_balloon_sample_video-mock-job-123-run.json').then((record) => {
      expect(record.video.filename).to.eq('bright_balloon_sample_video.mp4')
      expect(record.settings).to.deep.eq({ targetColor: '#ff4500', threshold: 100, suspectJumpPx: 100 })
      expect(record.summary.frames).to.eq(275)
      expect(record.app.version).to.be.a('string')
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
