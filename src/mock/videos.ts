// Fake data shaped like the real API responses, used when running `npm run dev:mock`.

// GET /api/videos -> an array of file names
export const mockVideoList: string[] = [
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
