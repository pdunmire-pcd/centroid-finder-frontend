import { useState } from 'react'
import { VideoPlayer } from '../../../src/components/player/VideoPlayer'
import { useVideoFrames } from '../../../src/hooks/useVideoFrames'

const SRC = `${import.meta.env.BASE_URL}mock/sample.mp4`

/** Average of r, g and b over every pixel, rounded. 0 would mean all black. */
function averageBrightness(image: ImageData): number {
  let sum = 0
  for (let i = 0; i < image.data.length; i += 4) {
    sum += (image.data[i] + image.data[i + 1] + image.data[i + 2]) / 3
  }
  return Math.round(sum / (image.width * image.height))
}

/** A tiny test page: the player plus a line of text about the last frame read. */
function Harness() {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null)
  const frame = useVideoFrames(video, 640)

  return (
    <>
      <VideoPlayer src={SRC} onVideoElement={setVideo} />
      <p data-testid="frame-info">
        {frame
          ? `${frame.image.width}x${frame.image.height} of ${frame.videoWidth}x${frame.videoHeight} at ${frame.time.toFixed(2)}`
          : 'none'}
      </p>
      <p data-testid="frame-brightness">{frame ? averageBrightness(frame.image) : ''}</p>
    </>
  )
}

describe('useVideoFrames', () => {
  it('reads the first frame at a smaller size', () => {
    cy.mount(<Harness />)
    cy.get('[data-testid="frame-info"]').should('have.text', '640x360 of 1920x1080 at 0.00')
  })

  it('reads a new frame after stepping while paused', () => {
    cy.mount(<Harness />)
    cy.get('[data-testid="frame-info"]').should('contain', 'at 0.00')

    cy.get('[aria-label="Next frame"]').click()
    cy.get('[aria-label="Next frame"]').click()
    // frame 2 starts at 0.08 s; we seek to its middle (0.10 s)
    cy.get('[data-testid="frame-info"]').should(($p) => {
      const time = Number($p.text().split(' at ')[1])
      expect(time).to.be.within(0.079, 0.111)
    })
  })

  it('gives real colors, not empty pixels', () => {
    cy.mount(<Harness />)
    cy.get('[data-testid="frame-brightness"]').should(($p) => {
      expect(Number($p.text())).to.be.greaterThan(10)
    })
  })
})
