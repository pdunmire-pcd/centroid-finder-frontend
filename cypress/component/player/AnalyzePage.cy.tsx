import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AnalyzePage from '../../../src/pages/AnalyzePage'

const SAMPLE = `${import.meta.env.BASE_URL}mock/sample.mp4`

/** Mounts the page at a URL, with the same routes as App.tsx. */
function mountAt(entry: string | { pathname: string; state: unknown }) {
  cy.mount(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/analyze/local" element={<AnalyzePage />} />
        <Route path="/analyze/:filename" element={<AnalyzePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('<AnalyzePage />', () => {
  it('plays a server video and finds the balloon', () => {
    // Component tests don't use mock mode, so getVideoUrl gives /videos/...;
    // we send that request to the sample video instead.
    cy.intercept('GET', '/videos/demo.mp4', (req) => req.redirect(SAMPLE))
    mountAt('/analyze/demo.mp4')

    cy.contains('h1', 'demo.mp4')
    cy.get('[data-testid="current-time"]').should('contain', '0:11.00')
    cy.get('[data-testid="centroid-info"]').should('contain', 'Centroid at (')
    cy.contains('button', 'Process Video with These Settings').should('be.enabled')
  })

  it('updates the analysis when the threshold changes', () => {
    cy.intercept('GET', '/videos/demo.mp4', (req) => req.redirect(SAMPLE))
    mountAt('/analyze/demo.mp4')
    cy.get('[data-testid="centroid-info"]').should('contain', 'Centroid at (')

    // Threshold 0 matches nothing (distance < 0 is never true).
    // Home moves a focused slider to its minimum, like a keyboard user would.
    cy.get('input[aria-labelledby="threshold-label"]').focus().type('{home}')
    cy.contains('Threshold: 0')
    cy.get('[data-testid="centroid-info"]').should('have.text', 'No matching pixels in this frame')
  })

  it('plays a local file from history state, and offers to upload it for processing', () => {
    cy.wrap(fetch(SAMPLE).then((res) => res.blob())).then((blob) => {
      const file = new File([blob as Blob], 'my-balloons.mp4', { type: 'video/mp4' })
      mountAt({ pathname: '/analyze/local', state: { file } })
    })

    cy.contains('h1', 'my-balloons.mp4')
    cy.get('[data-testid="current-time"]').should('contain', '0:11.00')
    cy.get('[data-testid="local-upload-note"]').should('contain', 'uploads it to the server first')
    cy.contains('button', 'Process Video with These Settings').should('be.enabled')
    cy.contains('This video is on your computer')
  })

  it('asks for a file when there is none', () => {
    mountAt('/analyze/local')
    cy.contains('Open a video from your computer')
  })
})
