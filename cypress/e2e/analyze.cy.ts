// Runs against `npm run dev:mock`, where every server video is the real
// balloon clip in public/mock/sample.mp4 (1920x1080, 25 fps, 275 frames).

/** Waits until the player knows the video's length. */
function waitForVideo() {
  cy.get('[data-testid="current-time"]', { timeout: 10000 }).should('contain', '0:11.00')
}

describe('Analyze page', () => {
  it('plays, pauses, steps and shows the centroid changing', () => {
    cy.visit('/analyze/demo.mp4')
    cy.contains('h1', 'demo.mp4')
    waitForVideo()
    cy.get('[data-testid="centroid-info"]').should('contain', 'Centroid at (')

    // Play for a moment, then pause: the trail has points now.
    cy.contains('button', 'Play').click()
    cy.get('[data-testid="trail-info"]').should(($p) => {
      expect(Number($p.text().replace(/\D/g, ''))).to.be.greaterThan(5)
    })
    cy.contains('button', 'Pause').click()

    // Remember the frame and centroid, step 10 frames, and check both changed.
    cy.get('[data-testid="frame-number"]').invoke('text').then((frameBefore) => {
      cy.get('[data-testid="centroid-info"]').invoke('text').then((centroidBefore) => {
        for (let i = 0; i < 10; i++) cy.get('body').type('.')
        cy.get('[data-testid="frame-number"]').should('not.have.text', frameBefore)
        cy.get('[data-testid="centroid-info"]').should('not.have.text', centroidBefore)
      })
    })
  })

  it('still processes the video and links the CSV', () => {
    cy.visit('/analyze/demo.mp4')
    cy.contains('Process Video with These Settings').click()
    cy.contains('Processing complete.', { timeout: 10000 })
    cy.contains('Download CSV').should('have.attr', 'href', '/mock/result.csv')
  })

  it('redirects the old preview link', () => {
    cy.visit('/preview/my%20video.mp4')
    cy.location('pathname').should('equal', '/analyze/my%20video.mp4')
    cy.contains('h1', 'my video.mp4')
  })

  it('opens a video from this computer', () => {
    cy.visit('/analyze/demo.mp4')
    cy.get('[data-testid="local-file-input"]').selectFile('public/mock/sample.mp4', { force: true })

    cy.location('pathname').should('equal', '/analyze/local')
    cy.contains('h1', 'sample.mp4')
    waitForVideo()
    cy.get('[data-testid="video"]').should('have.attr', 'src').and('match', /^blob:/)
    cy.get('[data-testid="centroid-info"]').should('contain', 'Centroid at (')

    // Local videos can't be sent to the server yet.
    cy.contains('button', 'Process Video with These Settings').should('be.disabled')
  })

  it('asks for a file on /analyze/local without one', () => {
    cy.visit('/analyze/local')
    cy.contains('Open a video from your computer')
    cy.get('[data-testid="open-local-panel"]')
      .find('[data-testid="local-file-input"]')
      .selectFile('public/mock/sample.mp4', { force: true })
    cy.contains('h1', 'sample.mp4')
    waitForVideo()
  })

  it('opens a video dropped on the page, and rejects other files', () => {
    cy.visit('/analyze/local')
    cy.get('[data-testid="drop-zone"]').selectFile('public/mock/result.csv', { action: 'drag-drop' })
    cy.contains('"result.csv" is not a video file')

    cy.get('[data-testid="drop-zone"]').selectFile('public/mock/sample.mp4', { action: 'drag-drop' })
    cy.contains('h1', 'sample.mp4')
    waitForVideo()
  })
})
