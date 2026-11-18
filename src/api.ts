export type ProcessingStatus =
  | { status: 'processing' }
  | { status: 'done'; result: string }
  | { status: 'error'; error: string }

export interface ProcessResponse {
  jobId: string
}

export async function processVideo(
  filename: string,
  targetColor: string,
  threshold: number,
): Promise<ProcessResponse> {
  const cleanFilename = encodeURIComponent(filename)
  const cleanColor = targetColor.replace(/^#/, '')
  const params = new URLSearchParams({
    targetColor: cleanColor,
    threshold: String(threshold),
  })

  const response = await fetch(
    `/process/${cleanFilename}?${params.toString()}`,
    { method: 'POST' },
  )

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  return response.json()
}

export async function getProcessingStatus(
  jobId: string,
): Promise<ProcessingStatus> {
  const response = await fetch(
    `/process/${encodeURIComponent(jobId)}/status`,
  )

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  return response.json()
}

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json() as { error?: string }
    return body.error ?? `Request failed with status ${response.status}`
  } catch {
    return `Request failed with status ${response.status}`
  }
}