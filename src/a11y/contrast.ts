// WCAG 2.2 contrast maths, used by tests/layout/contrast.test.ts to check
// every color pair of the theme in both modes.
//
// Contrast ratio = (L1 + 0.05) / (L2 + 0.05), where L1 is the relative
// luminance of the lighter color and L2 of the darker one. It goes from 1:1
// (same color) to 21:1 (black on white). WCAG AA asks for:
//   - 4.5:1 for normal text
//   - 3:1 for large text (24 px, or 18.66 px bold) and for the parts of
//     controls you need to see (input borders, focus rings, chart lines)

type Rgb = [number, number, number]

/** "#2e2a26" -> [46, 42, 38] */
export function hexToRgbTriple(hex: string): Rgb {
  const value = hex.replace(/^#/, '')
  if (!/^[0-9a-fA-F]{6}$/.test(value)) throw new Error(`Not a 6-digit hex color: ${hex}`)
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16)) as Rgb
}

/** Relative luminance (0 = black, 1 = white), from the WCAG definition. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgbTriple(hex).map((channel) => {
    const c = channel / 255
    // undo the sRGB "gamma" curve
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Contrast ratio between two colors, from 1 to 21. The order doesn't matter. */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

/**
 * The color you see when `top` is painted at `opacity` over `bottom`
 * (e.g. a 12% tint of the error color on a white card).
 */
export function blend(top: string, bottom: string, opacity: number): string {
  const t = hexToRgbTriple(top)
  const b = hexToRgbTriple(bottom)
  const mixed = t.map((channel, i) => Math.round(channel * opacity + b[i] * (1 - opacity)))
  return `#${mixed.map((c) => c.toString(16).padStart(2, '0')).join('')}`
}
