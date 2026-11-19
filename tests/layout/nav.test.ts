import { describe, expect, it } from 'vitest'
import { activeTab } from '../../src/components/layout/nav'

describe('activeTab', () => {
  it('picks the nav tab for a URL', () => {
    expect(activeTab('/videos')).toBe('videos')
    expect(activeTab('/analyze/clip.mp4')).toBe('videos')
    expect(activeTab('/preview/clip.mp4')).toBe('videos')
    expect(activeTab('/jobs')).toBe('jobs')
    expect(activeTab('/jobs/abc')).toBe('jobs')
    expect(activeTab('/something-else')).toBe(false)
  })
})
