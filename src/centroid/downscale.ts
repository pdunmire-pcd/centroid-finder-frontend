// Helpers for analysing a smaller copy of a frame (analyzeFrame's `scale`).
//
// Results at scale < 1 are APPROXIMATE: thin lines can disappear, groups that
// almost touch can merge, and centroids are only accurate to about
// 1 / scale pixels. Use scale = 1 when you need the exact Java answer.

import type { RgbaImage } from './binarizer'
import type { GroupBounds, GroupWithBounds } from './fastGroupFinder'

/**
 * Turns any scale into a usable one: values above 1, 0, negative numbers and
 * NaN all mean "full size" (1).
 */
export function normalizeScale(scale: number): number {
  return scale > 0 && scale < 1 ? scale : 1
}

/**
 * Makes a smaller copy of `frame` with nearest-neighbour sampling: every small
 * pixel copies the one original pixel nearest to its centre (no blending, so
 * colors stay exactly as they were in the video).
 */
export function downscaleNearest(frame: RgbaImage, scale: number): RgbaImage {
  const width = Math.max(1, Math.round(frame.width * scale))
  const height = Math.max(1, Math.round(frame.height * scale))
  const data = new Uint8ClampedArray(width * height * 4)

  // Work out once which original column each small column copies from.
  const sourceColumn = new Int32Array(width)
  for (let x = 0; x < width; x++) {
    sourceColumn[x] = Math.min(frame.width - 1, Math.floor(((x + 0.5) * frame.width) / width))
  }

  for (let y = 0; y < height; y++) {
    const sourceRow = Math.min(frame.height - 1, Math.floor(((y + 0.5) * frame.height) / height))
    for (let x = 0; x < width; x++) {
      const from = (sourceRow * frame.width + sourceColumn[x]) * 4
      const to = (y * width + x) * 4
      data[to] = frame.data[from]
      data[to + 1] = frame.data[from + 1]
      data[to + 2] = frame.data[from + 2]
      data[to + 3] = frame.data[from + 3]
    }
  }
  return { width, height, data }
}

/**
 * Converts groups found in a small copy (smallWidth x smallHeight) back into
 * full-size coordinates (fullWidth x fullHeight).
 *
 * - centroid: the centre of the small pixel, scaled up, then rounded down
 * - size: multiplied by how many full pixels one small pixel stands for
 * - bounds: grown so they cover every full pixel the small box covers, which
 *   means a group touching the small frame's edge still touches the full edge
 */
export function scaleGroupsUp(
  results: GroupWithBounds[],
  smallWidth: number,
  smallHeight: number,
  fullWidth: number,
  fullHeight: number,
): GroupWithBounds[] {
  const factorX = fullWidth / smallWidth
  const factorY = fullHeight / smallHeight

  return results.map(({ group, bounds }) => {
    const scaledBounds: GroupBounds = {
      minX: Math.floor(bounds.minX * factorX),
      minY: Math.floor(bounds.minY * factorY),
      maxX: Math.min(fullWidth - 1, Math.ceil((bounds.maxX + 1) * factorX) - 1),
      maxY: Math.min(fullHeight - 1, Math.ceil((bounds.maxY + 1) * factorY) - 1),
    }
    return {
      group: {
        size: Math.round(group.size * factorX * factorY),
        centroid: {
          x: Math.min(fullWidth - 1, Math.floor((group.centroid.x + 0.5) * factorX)),
          y: Math.min(fullHeight - 1, Math.floor((group.centroid.y + 0.5) * factorY)),
        },
      },
      bounds: scaledBounds,
    }
  })
}
