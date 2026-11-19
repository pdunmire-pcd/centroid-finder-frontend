// The fast path (binarizeInto + findConnectedGroupsFast, used by analyzeFrame)
// must give EXACTLY the same answer as the Java-matching reference
// (toBinaryArray + findConnectedGroups) on every input.

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  binarizeInto,
  findConnectedGroups,
  findConnectedGroupsFast,
  parseHexColor,
  toBinaryArray,
  toCsvRow,
  type RgbaImage,
} from '../../src/centroid'
import { analyzeFrame } from '../../src/centroid/engine'
import { fixture, loadRgba, randomImage, seededRandom, solidImage } from './helpers'

/** Checks analyzeFrame against the reference for one image, color and threshold. */
function expectSameAsReference(image: RgbaImage, color: number, threshold: number) {
  const referenceRows = toBinaryArray(image, color, threshold)
  const referenceGroups = findConnectedGroups(referenceRows)
  const referenceFlat = referenceRows.flat()

  const fast = analyzeFrame(image, color, threshold)

  // Compare the binary images first: a mismatch here is easier to debug.
  // (A plain loop, because toEqual on 2 million entries is very slow.)
  expect(fast.binary.length).toBe(referenceFlat.length)
  let firstMismatch = -1
  let referenceMatching = 0
  for (let p = 0; p < referenceFlat.length; p++) {
    if (referenceFlat[p] === 1) referenceMatching++
    if (firstMismatch === -1 && fast.binary[p] !== referenceFlat[p]) firstMismatch = p
  }
  expect(firstMismatch).toBe(-1)
  expect(fast.matchingPixels).toBe(referenceMatching)
  expect(fast.groups).toEqual(referenceGroups)
  expect(fast.width).toBe(image.width)
  expect(fast.height).toBe(image.height)
}

/** Color of pixel (x, y) as 0xRRGGBB. */
function colorAt(image: RgbaImage, x: number, y: number): number {
  const i = (y * image.width + x) * 4
  return (image.data[i] << 16) | (image.data[i + 1] << 8) | image.data[i + 2]
}

describe('fast path matches the reference on the fixtures', () => {
  it('squares.jpg with FFA200 / 164 still produces groups.csv', async () => {
    const image = await loadRgba(fixture('squares.jpg'))
    const expected = readFileSync(fixture('groups.csv'), 'utf8').trim().split(/\r?\n/)
    const fast = analyzeFrame(image, parseHexColor('FFA200'), 164)
    expect(fast.groups.map(toCsvRow)).toEqual(expected)
  })

  for (const name of ['squares.jpg', 'extractedFrame.png']) {
    it(`${name}: several colors and thresholds`, async () => {
      const image = await loadRgba(fixture(name))
      const random = seededRandom(42)
      // FFA200 (the Java test color) plus colors taken from the image itself,
      // so that some thresholds give large groups.
      const colors = [parseHexColor('FFA200')]
      for (let k = 0; k < 3; k++) {
        colors.push(colorAt(
          image,
          Math.floor(random() * image.width),
          Math.floor(random() * image.height),
        ))
      }
      for (const color of colors) {
        for (const threshold of [1, 30, 100, 164.5, 443]) {
          expectSameAsReference(image, color, threshold)
        }
      }
    }, 60_000)
  }
})

describe('fast path matches the reference on seeded random images', () => {
  it('300 random images, sizes and thresholds', () => {
    const random = seededRandom(12345)
    for (let run = 0; run < 300; run++) {
      const width = 1 + Math.floor(random() * 40)
      const height = 1 + Math.floor(random() * 40)
      // 2-5 random palette colors
      const palette: number[] = []
      const paletteSize = 2 + Math.floor(random() * 4)
      for (let k = 0; k < paletteSize; k++) palette.push(Math.floor(random() * 0x1000000))

      const image = randomImage(random, width, height, palette)
      const color = palette[0]
      const threshold = random() * 300
      expectSameAsReference(image, color, threshold)
    }
  })

  it('random binary images with different densities (group finder only)', () => {
    const random = seededRandom(7)
    for (let run = 0; run < 300; run++) {
      const width = 1 + Math.floor(random() * 60)
      const height = 1 + Math.floor(random() * 60)
      const density = random()
      const rows: number[][] = []
      const flat = new Uint8Array(width * height)
      for (let y = 0; y < height; y++) {
        const row: number[] = []
        for (let x = 0; x < width; x++) {
          const value = random() < density ? 1 : 0
          row.push(value)
          flat[y * width + x] = value
        }
        rows.push(row)
      }
      expect(findConnectedGroupsFast(flat, width, height)).toEqual(findConnectedGroups(rows))
    }
  })
})

describe('fast path matches the reference on edge cases', () => {
  it('1x1 image, on and off', () => {
    expectSameAsReference(solidImage(1, 1, 0xff0000), 0xff0000, 1)
    expectSameAsReference(solidImage(1, 1, 0xff0000), 0x00ff00, 1)
  })

  it('all on and all off', () => {
    expectSameAsReference(solidImage(30, 20, 0x336699), 0x336699, 50)
    expectSameAsReference(solidImage(30, 20, 0x336699), 0xffffff, 50)
  })

  it('a large all-on frame (1920x1080) does not overflow the stack', () => {
    expectSameAsReference(solidImage(1920, 1080, 0x112233), 0x112233, 10)
  })

  it('single rows and single columns', () => {
    const random = seededRandom(99)
    for (let run = 0; run < 50; run++) {
      const length = 1 + Math.floor(random() * 100)
      const palette = [0x000000, 0xffffff]
      expectSameAsReference(randomImage(random, length, 1, palette), 0x000000, 10)
      expectSameAsReference(randomImage(random, 1, length, palette), 0x000000, 10)
    }
  })

  it('threshold 0 and negative thresholds match nothing', () => {
    expectSameAsReference(solidImage(5, 5, 0), 0, 0)
    expectSameAsReference(solidImage(5, 5, 0), 0, -1)
  })

  it('pixels exactly on the threshold are left out (strict <)', () => {
    // 0x030400 is exactly sqrt(9 + 16) = 5 away from black
    const image = solidImage(3, 3, 0x030400)
    expect(binarizeInto(image, 0x000000, 5).matchingPixels).toBe(0)
    expect(binarizeInto(image, 0x000000, 5.0000001).matchingPixels).toBe(9)
    expectSameAsReference(image, 0x000000, 5)
  })
})
