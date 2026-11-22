// Fake data shaped like the real API responses, used when running `npm run dev:mock`.

// GET /api/videos -> an array of file names
export const mockVideoList: string[] = [
  'ensantina.mp4',
  'bright_balloon_sample_video.mp4',
  'salamander1.mp4',
  'salamander2.mov',
  'forest_intro.mp4',
]

// GET /thumbnail/:filename -> a JPEG. Every mock video uses the same image (in public/mock).
export const mockThumbnailUrl = '/mock/thumbnail.jpg'

// GET /videos/:filename -> every mock video plays public/mock/sample.mp4
export const mockVideoUrl = '/mock/sample.mp4'

// What ffprobe says about public/mock/sample.mp4 (11 s, 25 frames per second)
export const mockVideoProbe = { durationSeconds: 11, width: 1920, height: 1080 }

/** The files one mock video uses, all in public/mock. */
export type MockMedia = {
  video: string
  thumbnail: string
  /** CSV a finished job for this video points to (real videoprocessor.jar output) */
  result: string
  probe: { durationSeconds: number; width: number; height: number }
}

// ensantina.mp4 plays a real 30 s salamander clip (see public/mock/README.md).
// Every other mock video uses the balloon sample video.
const salamanderMedia: MockMedia = {
  video: '/mock/salamander.mp4',
  thumbnail: '/mock/salamander-thumbnail.jpg',
  result: '/mock/salamander-result.csv', // JAR output, targetColor 420500, threshold 60
  probe: { durationSeconds: 30, width: 816, height: 720 },
}
const defaultMedia: MockMedia = {
  video: mockVideoUrl,
  thumbnail: mockThumbnailUrl,
  result: '/mock/result.csv',
  probe: mockVideoProbe,
}

export function mockMediaFor(filename: string): MockMedia {
  return filename === 'ensantina.mp4' ? salamanderMedia : defaultMedia
}
