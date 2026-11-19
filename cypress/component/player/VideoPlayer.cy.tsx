import { VideoPlayer } from '../../../src/components/player/VideoPlayer'

// public/mock/sample.mp4 is the real balloon video: 1920x1080, 25 fps,
// 11 seconds, 275 frames. In component tests Cypress serves the public folder
// under Vite's base URL ("/__cypress/src/"), so we build the URL from it.
const SRC = `${import.meta.env.BASE_URL}mock/sample.mp4`

/** Waits until the browser knows the video's length. */
function waitForVideo() {
  cy.get<HTMLVideoElement>('[data-testid="video"]').should(($video) => {
    expect($video[0].readyState).to.be.at.least(1)
  })
  cy.get('[data-testid="current-time"]').should('contain', '0:11.00')
}

describe('<VideoPlayer />', () => {
  beforeEach(() => {
    cy.mount(<VideoPlayer src={SRC} />)
    waitForVideo()
  })

  it('starts paused at frame 0', () => {
    cy.get('[data-testid="frame-number"]').should('have.text', 'Frame 0 / 275')
    cy.contains('button', 'Play')
  })

  it('plays and pauses', () => {
    cy.contains('button', 'Play').click()
    cy.contains('button', 'Pause')
    cy.get<HTMLVideoElement>('[data-testid="video"]').should(($video) => {
      expect($video[0].paused).to.equal(false)
      expect($video[0].currentTime).to.be.greaterThan(0.2)
    })

    cy.contains('button', 'Pause').click()
    cy.contains('button', 'Play')
    cy.get<HTMLVideoElement>('[data-testid="video"]').its('0.paused').should('equal', true)
  })

  it('steps one frame forward and back', () => {
    cy.get('[aria-label="Next frame"]').click()
    cy.get('[data-testid="frame-number"]').should('have.text', 'Frame 1 / 275')
    cy.get('[aria-label="Next frame"]').click()
    cy.get('[data-testid="frame-number"]').should('have.text', 'Frame 2 / 275')
    cy.get('[aria-label="Previous frame"]').click()
    cy.get('[data-testid="frame-number"]').should('have.text', 'Frame 1 / 275')
  })

  it('steps frames and seeks with the keyboard', () => {
    cy.get('body').type('..')
    cy.get('[data-testid="frame-number"]').should('have.text', 'Frame 2 / 275')
    cy.get('body').type('{rightArrow}')
    cy.get('[data-testid="frame-number"]').should('have.text', 'Frame 27 / 275')
    cy.get('body').type(',')
    cy.get('[data-testid="frame-number"]').should('have.text', 'Frame 26 / 275')
  })

  it('changes the playback speed', () => {
    cy.get('[aria-label="2x speed"]').click()
    cy.get<HTMLVideoElement>('[data-testid="video"]').its('0.playbackRate').should('equal', 2)
    cy.get('[aria-label="2x speed"]').should('have.attr', 'aria-pressed', 'true')

    cy.get('[aria-label="0.25x speed"]').click()
    cy.get<HTMLVideoElement>('[data-testid="video"]').its('0.playbackRate').should('equal', 0.25)
  })
})

describe('<VideoPlayer /> shortcuts while typing', () => {
  it('does not step frames while typing in an input', () => {
    cy.mount(
      <>
        <input aria-label="Notes" />
        <VideoPlayer src={SRC} />
      </>,
    )
    waitForVideo()

    cy.get('[aria-label="Notes"]').type('...')
    cy.get('[data-testid="frame-number"]').should('have.text', 'Frame 0 / 275')
  })
})
