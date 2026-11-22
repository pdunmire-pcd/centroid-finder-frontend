// Copies the screenshots from cypress/design/screenshots.cy.ts into
// docs/progress/design-screenshots/<set>/ as smaller JPEG files, so the git
// history doesn't grow by tens of megabytes of PNG.
//
//   node scripts/save-design-screenshots.mjs before
//   node scripts/save-design-screenshots.mjs after

import { mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const set = process.argv[2] ?? 'after'
const from = path.join('cypress', 'screenshots', 'screenshots.cy.ts', set)
const to = path.join('docs', 'progress', 'design-screenshots', set)

await mkdir(to, { recursive: true })
const files = (await readdir(from)).filter((name) => name.endsWith('.png'))

for (const name of files) {
  const target = path.join(to, name.replace(/\.png$/, '.jpg'))
  // The screenshots are taken at 2x (a Retina screen). Halving them keeps
  // them readable while making the files about 4 times smaller.
  const image = sharp(path.join(from, name))
  const { width = 0 } = await image.metadata()
  await image
    .resize({ width: Math.round(width / 2) })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(target)
}

console.log(`Saved ${files.length} screenshots to ${to}`)
