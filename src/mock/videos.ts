// Fake data shaped like the real API responses, used when running `npm run dev:mock`.
// Each name here has a matching video in public/mock/videos/ and a first-frame JPEG
// in public/mock/thumbnails/ (named <video>.jpg).

// GET /api/videos -> an array of file names
export const mockVideoList: string[] = [
  'bright_balloon_sample_video.mp4',
  'ensantina.mp4',
]

// GET /thumbnail/:filename -> a JPEG of the first frame
export function mockThumbnailUrl(filename: string): string {
  return `/mock/thumbnails/${encodeURIComponent(filename)}.jpg`
}

// GET /video/:filename -> the video file
export function mockVideoUrl(filename: string): string {
  return `/mock/videos/${encodeURIComponent(filename)}`
}
