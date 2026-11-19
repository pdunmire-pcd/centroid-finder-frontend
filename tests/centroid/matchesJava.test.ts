// End-to-end check that the TypeScript port produces exactly the same groups
// as the Java backend.
//
// groups.csv was produced by the Java centroid finder on squares.jpg with
// target color FFA200 and threshold 164.
//
// The image is decoded with sharp (libjpeg-turbo). JPEG decoders can produce
// slightly different pixels; sharp matches Java's ImageIO exactly on this
// image, while a pure-JS decoder (jpeg-js) does not.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import {
  findConnectedGroups,
  parseHexColor,
  toBinaryArray,
  toCsvRow,
  type RgbaImage,
} from '../../src/centroid'

const fixture = (name: string) =>
  fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url))

async function loadRgba(path: string): Promise<RgbaImage> {
  const { data, info } = await sharp(path)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  return { width: info.width, height: info.height, data }
}

describe('matches the Java implementation', () => {
  it('squares.jpg with FFA200 / 164 produces sampleOutput/groups.csv', async () => {
    const image = await loadRgba(fixture('squares.jpg'))
    const expected = readFileSync(fixture('groups.csv'), 'utf8')
      .trim()
      .split(/\r?\n/)

    const groups = findConnectedGroups(
      toBinaryArray(image, parseHexColor('FFA200'), 164),
    )

    expect(groups.map(toCsvRow)).toEqual(expected)
  })
})
