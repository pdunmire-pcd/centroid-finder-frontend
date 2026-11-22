// Makes 2x close-ups (device pixels, not resized) of the red centroid dot on
// the binarized view, before and after the high-DPI change, so the sharpness
// difference is visible. Run after the screenshot spec has made both sets:
//
//   node scripts/crop-dot-closeups.mjs

import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const SIZE = 240 // device pixels around the dot

for (const set of ['before', 'after']) {
  const file = `cypress/screenshots/screenshots.cy.ts/${set}/analyze-light-1280.png`
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true })

  // The dot is the only bright red (#ff1744) on the right half of the page,
  // in the first screen of the Analyze page.
  let sumX = 0
  let sumY = 0
  let count = 0
  for (let y = 0; y < Math.min(info.height, 2400); y++) {
    for (let x = Math.floor(info.width / 2); x < info.width; x++) {
      const i = (y * info.width + x) * info.channels
      if (data[i] > 230 && data[i + 1] < 60 && data[i + 2] > 40 && data[i + 2] < 110) {
        sumX += x
        sumY += y
        count++
      }
    }
  }
  if (count === 0) throw new Error(`No dot found in ${file}`)
  const cx = Math.round(sumX / count)
  const cy = Math.round(sumY / count)

  await mkdir('docs/progress/design-screenshots/closeups', { recursive: true })
  await sharp(file)
    .extract({ left: cx - SIZE / 2, top: cy - SIZE / 2, width: SIZE, height: SIZE })
    .resize({ width: SIZE * 2, kernel: 'nearest' }) // enlarge without smoothing, to show the real pixels
    .png()
    .toFile(`docs/progress/design-screenshots/closeups/centroid-dot-${set}.png`)
  console.log(`${set}: dot at (${cx}, ${cy})`)
}
