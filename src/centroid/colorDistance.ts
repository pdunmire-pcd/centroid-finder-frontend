// Port of EuclideanColorDistance.java.

/**
 * Returns the Euclidean distance between two colors given as 24-bit integers
 * in the form 0xRRGGBB:
 *
 *   sqrt((r1 - r2)^2 + (g1 - g2)^2 + (b1 - b2)^2)
 *
 * JavaScript's >> and & convert their operands to 32-bit signed integers, the
 * same as Java ints, so the extracted components match Java exactly. Any alpha
 * byte above the RGB bits is dropped by the & 0xff masks.
 */
export function euclideanColorDistance(colorA: number, colorB: number): number {
  // extract red
  const redA = (colorA >> 16) & 0xff
  const redB = (colorB >> 16) & 0xff

  // extract green
  const greenA = (colorA >> 8) & 0xff
  const greenB = (colorB >> 8) & 0xff

  // extract blue
  const blueA = colorA & 0xff
  const blueB = colorB & 0xff

  // differences
  const redDiff = redA - redB
  const greenDiff = greenA - greenB
  const blueDiff = blueA - blueB

  // squares
  const redSquared = redDiff * redDiff
  const greenSquared = greenDiff * greenDiff
  const blueSquared = blueDiff * blueDiff

  const sum = redSquared + greenSquared + blueSquared

  return Math.sqrt(sum)
}

/**
 * Converts a hex color string such as "#ff0000", "FFA200" or "ffa200" into a
 * 0xRRGGBB integer, like Java's Integer.parseInt(hex, 16).
 */
export function parseHexColor(hex: string): number {
  const clean = hex.replace(/^#/, '')
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    throw new RangeError(`invalid hex color: ${hex}`)
  }
  return parseInt(clean, 16)
}
