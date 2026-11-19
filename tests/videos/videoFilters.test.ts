import { describe, expect, it } from 'vitest'
import { filterAndSortVideos, isVideoFile } from '../../src/components/videos/videoFilters'
import type { VideoInfo } from '../../src/types'

const videos: VideoInfo[] = [
  { filename: 'salamander10.mp4', status: 'tracked' },
  { filename: 'Salamander2.mov', status: 'not-processed' },
  { filename: 'forest.mp4', status: 'error' },
  { filename: 'balloon.mp4', status: 'processing' },
]

const names = (list: VideoInfo[]) => list.map((v) => v.filename)

describe('filterAndSortVideos', () => {
  it('searches by name, ignoring case', () => {
    expect(names(filterAndSortVideos(videos, 'SALA', 'name-asc'))).toEqual([
      'Salamander2.mov',
      'salamander10.mp4',
    ])
  })

  it('sorts names with numbers in natural order', () => {
    expect(names(filterAndSortVideos(videos, '', 'name-asc'))).toEqual([
      'balloon.mp4',
      'forest.mp4',
      'Salamander2.mov',
      'salamander10.mp4',
    ])
    expect(names(filterAndSortVideos(videos, '', 'name-desc'))[0]).toBe('salamander10.mp4')
  })

  it('sorts by status: processing, error, tracked, not processed', () => {
    expect(names(filterAndSortVideos(videos, '', 'status'))).toEqual([
      'balloon.mp4',
      'forest.mp4',
      'salamander10.mp4',
      'Salamander2.mov',
    ])
  })

  it('does not change the original array', () => {
    const copy = [...videos]
    filterAndSortVideos(videos, '', 'name-desc')
    expect(videos).toEqual(copy)
  })
})

describe('isVideoFile', () => {
  it('accepts video MIME types and video extensions', () => {
    expect(isVideoFile(new File([], 'a.bin', { type: 'video/mp4' }))).toBe(true)
    expect(isVideoFile(new File([], 'clip.MOV'))).toBe(true)
    expect(isVideoFile(new File([], 'notes.txt', { type: 'text/plain' }))).toBe(false)
  })
})
