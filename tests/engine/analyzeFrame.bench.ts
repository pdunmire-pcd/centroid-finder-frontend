// Benchmark: how long one 1920x1080 frame takes, old path vs new path.
// Run with:  npm run bench
// (Files ending in .bench.ts are only run by `vitest bench`, not by `npm test`.)
//
// For live video at 24 fps we have about 41 ms per frame.
//
// It is a plain timing loop on purpose: run the code a few times to warm up
// (so the JavaScript engine has optimised it), then time many runs and report
// the average and the fastest, in milliseconds per frame.

import { describe, it } from 'vitest'
import {
  binarizeInto,
  findConnectedGroups,
  findConnectedGroupsFast,
  parseHexColor,
  toBinaryArray,
  type RgbaImage,
} from '../../src/centroid'
import { analyzeFrame } from '../../src/centroid/engine'
import { fixture, loadRgba } from './helpers'

type Row = { name: string; meanMs: number; minMs: number; fps: number }

function time(name: string, runs: number, fn: () => void): Row {
  for (let k = 0; k < 3; k++) fn() // warm up
  const times: number[] = []
  for (let k = 0; k < runs; k++) {
    const start = performance.now()
    fn()
    times.push(performance.now() - start)
  }
  const meanMs = times.reduce((a, b) => a + b, 0) / times.length
  return { name, meanMs, minMs: Math.min(...times), fps: 1000 / meanMs }
}

function printTable(title: string, rows: Row[]) {
  console.log(`\n${title}`)
  console.table(rows.map((r) => ({
    path: r.name,
    'mean ms/frame': r.meanMs.toFixed(1),
    'min ms/frame': r.minMs.toFixed(1),
    'frames/s': r.fps.toFixed(0),
  })))
}

function colorAt(frame: RgbaImage, x: number, y: number): number {
  const i = (y * frame.width + x) * 4
  return (frame.data[i] << 16) | (frame.data[i + 1] << 8) | frame.data[i + 2]
}

describe('benchmark: 1920x1080 frame', () => {
  it('old vs new', async () => {
    const frame = await loadRgba(fixture('extractedFrame.png'))

    const cases = [
      { label: 'color from the middle of the frame, threshold 60', color: colorAt(frame, 960, 540), threshold: 60 },
      { label: 'FFA200, threshold 164', color: parseHexColor('FFA200'), threshold: 164 },
    ]

    for (const { label, color, threshold } of cases) {
      const matching = analyzeFrame(frame, color, threshold)
      printTable(
        `${label} (${matching.matchingPixels} matching px, ${matching.groups.length} groups)`,
        [
          time('old: toBinaryArray + findConnectedGroups', 15, () => {
            findConnectedGroups(toBinaryArray(frame, color, threshold))
          }),
          time('new: analyzeFrame, scale 1 (exact)', 50, () => {
            analyzeFrame(frame, color, threshold)
          }),
          time('new: analyzeFrame, scale 0.5 (approx.)', 50, () => {
            analyzeFrame(frame, color, threshold, 0.5)
          }),
        ],
      )
    }

    // The two steps on their own.
    const color = colorAt(frame, 960, 540)
    const rows = toBinaryArray(frame, color, 60)
    const binary = binarizeInto(frame, color, 60).binary
    printTable('steps on their own (middle color, threshold 60)', [
      time('old binarizer: toBinaryArray', 15, () => { toBinaryArray(frame, color, 60) }),
      time('new binarizer: binarizeInto (reused output)', 50, () => {
        binarizeInto(frame, color, 60, binary)
      }),
      time('old group finder: findConnectedGroups', 15, () => { findConnectedGroups(rows) }),
      time('new group finder: findConnectedGroupsFast', 50, () => {
        findConnectedGroupsFast(binary, frame.width, frame.height)
      }),
    ])
  }, 300_000)
})
