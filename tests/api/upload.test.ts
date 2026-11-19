import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { uploadVideo } from '../../src/api'

/**
 * A pretend XMLHttpRequest. Tests drive it by hand: progress() fires
 * upload.onprogress, respond() finishes the request.
 */
class FakeXhr {
  static last: FakeXhr | undefined
  method = ''
  url = ''
  body: unknown
  status = 0
  responseText = ''
  aborted = false
  upload: { onprogress: ((event: { lengthComputable: boolean; loaded: number; total: number }) => void) | null } = {
    onprogress: null,
  }
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  onabort: (() => void) | null = null

  constructor() {
    FakeXhr.last = this
  }
  open(method: string, url: string) {
    this.method = method
    this.url = url
  }
  send(body: unknown) {
    this.body = body
  }
  abort() {
    this.aborted = true
    this.onabort?.()
  }
  progress(loaded: number, total: number) {
    this.upload.onprogress?.({ lengthComputable: true, loaded, total })
  }
  respond(status: number, body: string) {
    this.status = status
    this.responseText = body
    this.onload?.()
  }
}

function lastXhr(): FakeXhr {
  if (!FakeXhr.last) throw new Error('no XHR was created')
  return FakeXhr.last
}

const file = new File(['fake video bytes'], 'clip.mp4', { type: 'video/mp4' })

describe('uploadVideo (real server)', () => {
  beforeEach(() => {
    FakeXhr.last = undefined
    vi.stubGlobal('XMLHttpRequest', FakeXhr)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('POSTs the file in the "video" field and reports progress', async () => {
    const fractions: number[] = []
    const promise = uploadVideo(file, (f) => fractions.push(f))
    const xhr = lastXhr()

    xhr.progress(25, 100)
    xhr.progress(100, 100)
    xhr.respond(201, JSON.stringify({ filename: 'clip.mp4', status: 'not-processed' }))

    await expect(promise).resolves.toEqual({ filename: 'clip.mp4', status: 'not-processed' })
    expect(xhr.method).toBe('POST')
    expect(xhr.url).toBe('/api/videos')
    expect((xhr.body as FormData).get('video')).toBeInstanceOf(File)
    expect(fractions).toEqual([0, 0.25, 1, 1])
  })

  it("uses the server's JSON error message", async () => {
    const promise = uploadVideo(file)
    lastXhr().respond(409, JSON.stringify({ error: 'A video with that name already exists' }))
    await expect(promise).rejects.toThrow('A video with that name already exists')
  })

  it('falls back to the status code when the error is not JSON', async () => {
    const promise = uploadVideo(file)
    lastXhr().respond(502, '<html>Bad gateway</html>')
    await expect(promise).rejects.toThrow('Request failed with status 502')
  })

  it('aborts the request when the signal fires', async () => {
    const controller = new AbortController()
    const promise = uploadVideo(file, undefined, controller.signal)
    controller.abort()
    await expect(promise).rejects.toThrow('Upload cancelled')
    expect(lastXhr().aborted).toBe(true)
  })

  it('does not start when the signal was already aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(uploadVideo(file, undefined, controller.signal)).rejects.toThrow('Upload cancelled')
    expect(FakeXhr.last).toBeUndefined()
  })

  it('rejects on a network error', async () => {
    const promise = uploadVideo(file)
    lastXhr().onerror?.()
    await expect(promise).rejects.toThrow('Network error')
  })
})
