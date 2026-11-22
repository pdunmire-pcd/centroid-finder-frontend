// The pages the design checks visit, shared by the accessibility spec and the
// screenshot spec. They run against `npm run dev:mock`, where ensantina.mp4 is
// a real salamander clip and mock-job-125 holds its real tracking results.

export type DesignPage = {
  /** short name, used in screenshot file names */
  name: string
  url: string
  /** something that is on screen once the page has finished loading */
  ready: string
}

export const DESIGN_PAGES: DesignPage[] = [
  { name: 'videos', url: '/videos', ready: '[data-cy="video-card"]' },
  { name: 'analyze', url: '/analyze/ensantina.mp4', ready: '[data-testid="live-stats"]' },
  { name: 'jobs', url: '/jobs', ready: '[data-cy="job-row"]' },
  { name: 'job-results', url: '/jobs/mock-job-125', ready: '[data-cy="track-table"]' },
  { name: 'not-found', url: '/no-such-page', ready: 'h1' },
]

export const THEMES = ['light', 'dark'] as const
export type ThemeName = (typeof THEMES)[number]

/** Visits a page with the light/dark choice already saved, like a returning user. */
export function visitInTheme(page: DesignPage, theme: ThemeName) {
  cy.visit(page.url, {
    onBeforeLoad(win) {
      // the same key src/components/layout/colorMode.ts uses
      win.localStorage.setItem('centroid-finder.color-mode', theme)
    },
  })
  cy.get(page.ready, { timeout: 20000 }).should('exist')
  // wait for the self-hosted fonts, so screenshots and contrast checks see the real text
  cy.document().its('fonts.status').should('equal', 'loaded')
}
