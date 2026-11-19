// Shared types for the UI upgrade. Every workstream imports from here, so
// change a type only after agreeing it in the plan doc ("API contracts").

/** One video in GET /api/videos. */
export type VideoInfo = {
  filename: string
  status: 'not-processed' | 'processing' | 'tracked' | 'error'
  durationSeconds?: number
  width?: number
  height?: number
}

/** One processing run, from GET /api/jobs and GET /api/jobs/:id. */
export type JobRecord = {
  jobId: string
  filename: string
  /** hex without '#', e.g. "660005" */
  targetColor: string
  /** 0-442 */
  threshold: number
  status: 'processing' | 'done' | 'error'
  /** ISO date */
  startedAt: string
  finishedAt?: string
  /** CSV link when done */
  resultUrl?: string
  error?: string
}

/** One CSV row. x = y = -1 means nothing matched in that frame. */
export type TrackPoint = { seconds: number; x: number; y: number }

export type RgbTriple = [number, number, number]

/** One click of the eyedropper. */
export type ColorSample = {
  seconds: number
  x: number
  y: number
  /** side of the averaged square in pixels: 1, 3, 5 ... */
  size: number
  rgb: RgbTriple
}

/** A saved tracking color, reusable across videos. */
export type ColorProfile = {
  name: string
  samples: ColorSample[]
  /** hex without '#' */
  targetColor: string
  threshold: number
}

/** Where the Analyze page gets its video from. */
export type VideoSource =
  | { kind: 'server'; filename: string }
  | { kind: 'local'; file: File }

/** A problem the quality checks found in a frame. */
export type Warning = {
  code: 'too-many-matching' | 'touches-edge' | 'competing-group' | 'many-groups' | 'no-match'
  message: string
  /** what the user can do about it */
  fix: string
}
