// Runs against `npm run dev:mock` (no Express server needed).
describe('API layer in mock mode', () => {
  it('keeps /videos as the React video chooser page', () => {
    cy.visit('/videos')
    cy.contains('bright_balloon_sample_video.mp4')
  })

  it('answers a page load of /videos/<file> with index.html instead of proxying it', () => {
    cy.request({ url: '/videos/some_video.mp4', headers: { accept: 'text/html' } })
      .its('body')
      .should('include', '<div id="root">')
  })

  it('serves the mock CSV in the same format as the JAR', () => {
    cy.request('/mock/result.csv').then((response) => {
      const lines = String(response.body).trim().split('\n')
      expect(lines).to.have.length(275)
      expect(lines[0]).to.eq('0.000,1080,581')
      expect(lines.some((line) => line.endsWith(',-1,-1'))).to.eq(true)
    })
  })

  it('serves the mock video in pieces (HTTP Range), so the player can seek', () => {
    cy.request({ url: '/mock/sample.mp4', headers: { range: 'bytes=0-99' }, encoding: 'binary' }).then((response) => {
      expect(response.status).to.eq(206)
      expect(response.headers['content-range']).to.match(/^bytes 0-99\//)
    })
  })
})
