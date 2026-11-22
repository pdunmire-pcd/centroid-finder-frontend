import type { VideoInfo } from '../../types'

// Pure helpers for the Videos page: search and sort. No React here,
// so they are easy to unit test.

export type VideoSort = 'name-asc' | 'name-desc' | 'status'

export const SORT_LABELS: Record<VideoSort, string> = {
  'name-asc': 'Name (A–Z)',
  'name-desc': 'Name (Z–A)',
  status: 'Status',
}

// Order used when sorting by status: things that need attention first
const STATUS_ORDER: Record<VideoInfo['status'], number> = {
  processing: 0,
  error: 1,
  tracked: 2,
  'not-processed': 3,
}

export const STATUS_LABELS: Record<VideoInfo['status'], string> = {
  tracked: 'Tracked',
  processing: 'Processing',
  error: 'Error',
  'not-processed': 'Not processed',
}

/** Keeps videos whose name contains the search text (ignoring case), then sorts them. */
export function filterAndSortVideos(videos: VideoInfo[], search: string, sort: VideoSort): VideoInfo[] {
  const needle = search.trim().toLowerCase()
  const matching = videos.filter((v) => v.filename.toLowerCase().includes(needle))

  // localeCompare with numeric: true puts "clip2" before "clip10"
  const byName = (a: VideoInfo, b: VideoInfo) =>
    a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' })

  // Copy first, because sort() changes the array it is called on
  const sorted = [...matching]
  if (sort === 'name-asc') sorted.sort(byName)
  if (sort === 'name-desc') sorted.sort((a, b) => byName(b, a))
  if (sort === 'status') {
    sorted.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || byName(a, b))
  }
  return sorted
}

/** True if the file looks like a video, by MIME type or by extension. */
export function isVideoFile(file: File): boolean {
  if (file.type.startsWith('video/')) return true
  return /\.(mp4|mov|m4v|webm|avi|mkv)$/i.test(file.name)
}
