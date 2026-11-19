import { describe, expect, it } from 'vitest'
import { analyzeFrame, ignoreTopMargin } from '../../src/centroid/engine'

// A 10x10 black image with a big white strip in the top two rows (like the
// dark strip in the salamander videos) and a smaller white square lower down.
function makeImage() {
  const width = 10
  const height = 10
  const data = new Uint8ClampedArray(width * height * 4)
  const paint = (x: number, y: number) => {
    const i = (y * width + x) * 4
    data[i] = 255
    data[i + 1] = 255
    data[i + 2] = 255
    data[i + 3] = 255
  }
  for (let y = 0; y < 2; y++) for (let x = 0; x < 10; x++) paint(x, y) // strip: 20 px
  for (let y = 6; y < 9; y++) for (let x = 3; x < 6; x++) paint(x, y) // square: 9 px
  return { width, height, data }
}

describe('ignoreTopMargin', () => {
  it('ignoreTopMargin_stripInTopRows_tracksTheSquareInstead', () => {
    // Arrange
    const analysis = analyzeFrame(makeImage(), 0xffffff, 10)

    // Act
    const filtered = ignoreTopMargin(analysis, 3)

    // Assert
    expect(analysis.groups[0].size).toBe(20) // without the rule, the strip wins
    expect(filtered.groups).toHaveLength(1)
    expect(filtered.groups[0]).toEqual({ size: 9, centroid: { x: 4, y: 7 } })
    expect(filtered.bounds).toHaveLength(1)
  })

  it('ignoreTopMargin_zeroMargin_returnsTheSameAnalysis', () => {
    // Arrange
    const analysis = analyzeFrame(makeImage(), 0xffffff, 10)

    // Act + Assert
    expect(ignoreTopMargin(analysis, 0)).toBe(analysis)
  })
})
