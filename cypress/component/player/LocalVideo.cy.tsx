import { LocalVideoPicker, VideoDropZone } from '../../../src/components/player/LocalVideoPicker'
import { VideoPlayer } from '../../../src/components/player/VideoPlayer'

const SRC = `${import.meta.env.BASE_URL}mock/sample.mp4`

describe('local video files', () => {
  it('plays a File through a blob: URL', () => {
    cy.wrap(fetch(SRC).then((res) => res.blob())).then((blob) => {
      const file = new File([blob as Blob], 'balloons.mp4', { type: 'video/mp4' })
      cy.mount(<VideoPlayer src={file} />)
    })
    cy.get<HTMLVideoElement>('[data-testid="video"]').should(($video) => {
      expect($video[0].src).to.match(/^blob:/)
    })
    cy.get('[data-testid="current-time"]').should('contain', '0:11.00')
  })

  it('shows a clear error when the browser cannot decode the file', () => {
    const notReallyVideo = new File(['this is text, not video'], 'broken.mp4', { type: 'video/mp4' })
    cy.mount(<VideoPlayer src={notReallyVideo} />)
    cy.get('[data-testid="video-error"]').should('contain', 'Your browser')
  })

  it('opens a file picked with the button', () => {
    const onFile = cy.stub().as('onFile')
    cy.mount(<LocalVideoPicker onFile={onFile} />)
    cy.get('[data-testid="local-file-input"]').selectFile('public/mock/sample.mp4', { force: true })
    cy.get('@onFile').should('have.been.calledOnce')
    cy.get('@onFile').its('firstCall.args.0.name').should('equal', 'sample.mp4')
  })

  it('opens a file dropped on the drop zone', () => {
    const onFile = cy.stub().as('onFile')
    cy.mount(
      <VideoDropZone onFile={onFile}>
        <div style={{ height: 200 }}>Drop here</div>
      </VideoDropZone>,
    )
    cy.get('[data-testid="drop-zone"]').selectFile('public/mock/sample.mp4', { action: 'drag-drop' })
    cy.get('@onFile').its('firstCall.args.0.name').should('equal', 'sample.mp4')
  })
})
