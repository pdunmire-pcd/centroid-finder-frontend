import { describe, expect, it } from 'vitest'
import {
  describeMediaError,
  isVideoFile,
  LARGE_FILE_BYTES,
  localFileError,
  localFileWarning,
} from '../../src/components/player/localVideo'

const mp4 = { name: 'balloons.mp4', type: 'video/mp4', size: 4_000_000 }

describe('isVideoFile', () => {
  it('accepts video types', () => {
    expect(isVideoFile(mp4)).toBe(true)
    expect(isVideoFile({ name: 'a.mov', type: 'video/quicktime', size: 1 })).toBe(true)
  })

  it('accepts known video names when the type is missing', () => {
    expect(isVideoFile({ name: 'clip.MKV', type: '', size: 1 })).toBe(true)
  })

  it('rejects other files', () => {
    expect(isVideoFile({ name: 'photo.png', type: 'image/png', size: 1 })).toBe(false)
    expect(isVideoFile({ name: 'notes', type: '', size: 1 })).toBe(false)
  })
})

describe('localFileError', () => {
  it('is null for videos and explains other files', () => {
    expect(localFileError(mp4)).toBeNull()
    expect(localFileError({ name: 'photo.png', type: 'image/png', size: 1 })).toContain('"photo.png" is not a video')
  })
})

describe('localFileWarning', () => {
  it('warns only above 2 GB', () => {
    expect(localFileWarning({ ...mp4, size: LARGE_FILE_BYTES })).toBeNull()
    expect(localFileWarning({ ...mp4, size: 3 * 1024 ** 3 })).toContain('3.0 GB')
  })
})

describe('describeMediaError', () => {
  it('explains unsupported formats', () => {
    expect(describeMediaError(4)).toContain('cannot play this video format')
  })

  it('has a fallback message', () => {
    expect(describeMediaError(undefined)).toBe('The video could not be played.')
  })
})
