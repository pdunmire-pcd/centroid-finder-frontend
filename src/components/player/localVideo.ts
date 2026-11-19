// Checks for videos the user opens from their own computer.

/** Bigger files still open, but we warn that the browser may struggle. */
export const LARGE_FILE_BYTES = 2 * 1024 * 1024 * 1024 // 2 GB

/** Some systems give no type for these, so we also accept them by name. */
const VIDEO_EXTENSIONS = /\.(mp4|m4v|mov|webm|mkv|avi|ogv)$/i

/** The parts of a File we look at, so tests can pass plain objects. */
export type FileLike = Pick<File, 'name' | 'type' | 'size'>

/** True for files the browser says are videos (type "video/..."). */
export function isVideoFile(file: FileLike): boolean {
  if (file.type.startsWith('video/')) return true
  return file.type === '' && VIDEO_EXTENSIONS.test(file.name)
}

/** An error message if we can't open the file, otherwise null. */
export function localFileError(file: FileLike): string | null {
  if (!isVideoFile(file)) {
    return `"${file.name}" is not a video file. Choose a video such as an .mp4 file.`
  }
  return null
}

/** A warning for very big files, otherwise null. */
export function localFileWarning(file: FileLike): string | null {
  if (file.size > LARGE_FILE_BYTES) {
    const gigabytes = (file.size / 1024 ** 3).toFixed(1)
    return `This video is ${gigabytes} GB. Very large files can be slow or fail to play in the browser.`
  }
  return null
}

/**
 * A friendly message for the <video> element's error codes
 * (MediaError.code: 1 aborted, 2 network, 3 decode, 4 not supported).
 */
export function describeMediaError(code: number | undefined): string {
  switch (code) {
    case 1:
      return 'Loading the video was stopped.'
    case 2:
      return 'A network error stopped the video from loading.'
    case 3:
      return 'Your browser could not decode this video. The file may be damaged or use an unusual codec.'
    case 4:
      return 'Your browser cannot play this video format. Try converting it to MP4 (H.264).'
    default:
      return 'The video could not be played.'
  }
}
