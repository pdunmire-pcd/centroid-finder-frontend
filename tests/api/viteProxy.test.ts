import type { IncomingMessage } from 'node:http'
import { describe, expect, it } from 'vitest'
import config, { sendPagesToReact } from '../../vite.config'

function request(accept: string | undefined): IncomingMessage {
  return { headers: accept ? { accept } : {} } as IncomingMessage
}

const proxy = config.server?.proxy ?? {}

/** The proxy keys whose rule would send this path to Express. */
function matchingKeys(path: string): string[] {
  return Object.keys(proxy).filter((key) =>
    key.startsWith('^') ? new RegExp(key).test(path) : path.startsWith(key),
  )
}

describe('Vite dev proxy', () => {
  it('sends the backend routes to Express', () => {
    for (const path of ['/api/videos', '/api/jobs', '/thumbnail/a.mp4', '/frame/a.mp4?t=1', '/process/a.mp4', '/results/x.csv']) {
      expect(matchingKeys(path), path).not.toEqual([])
    }
  })

  it('proxies video files but not the /videos page', () => {
    expect(matchingKeys('/videos/bright_balloon_sample_video.mp4')).toEqual(['^/videos/.+'])
    expect(matchingKeys('/videos')).toEqual([])
    expect(matchingKeys('/videos/')).toEqual([])
  })

  it('sends page loads to React and file requests to Express', () => {
    expect(sendPagesToReact(request('text/html,application/xhtml+xml,*/*;q=0.8'))).toBe('/index.html')
    expect(sendPagesToReact(request('video/webm,video/ogg,video/*;q=0.9,*/*;q=0.5'))).toBeUndefined()
    expect(sendPagesToReact(request('*/*'))).toBeUndefined()
    expect(sendPagesToReact(request(undefined))).toBeUndefined()
  })
})
