import { useState } from 'react'
import Icon from '../../components/ui/Icon'
import Modal from '../../components/ui/Modal'
import type { Project, ProjectImage } from '../../types/approval'
import { dateLabel } from '../../utils/format'

function ProjectPhoto({ image, onOpen }: { image: ProjectImage; onOpen: () => void }) {
  const [failed, setFailed] = useState(false)
  return <figure className="approval-photo">
    {failed ? <div className="approval-photo-unavailable"><Icon name="image" size={25} /><span>Image unavailable</span></div> : <button className="approval-photo-open" type="button" onClick={onOpen} aria-label={`Enlarge ${image.alt || 'project image'}`} aria-haspopup="dialog"><img src={image.url} alt={image.alt} loading="lazy" onError={() => setFailed(true)} /><span><Icon name="expand" size={16} /></span></button>}
    {(image.caption || image.capturedAt || image.capturedBy) && <figcaption>{image.caption && <strong>{image.caption}</strong>}{image.capturedAt && <time dateTime={image.capturedAt}>{dateLabel(image.capturedAt)}</time>}{image.capturedBy && <span>{image.capturedBy}</span>}</figcaption>}
  </figure>
}

export default function ApprovalProjectImages({ project }: { project: Project }) {
  const [selected, setSelected] = useState<number | null>(null)
  const images = project.images?.filter(image => image.url.trim()) ?? []
  const currentImage = selected !== null ? images[selected] : undefined
  return <section className="approval-section approval-images-section" id="project-images" aria-labelledby="images-heading">
    <div className="approval-section-heading"><h2 id="images-heading">Project images</h2><span>{images.length ? `${images.length} ${images.length === 1 ? 'photo' : 'photos'}` : 'Site documentation'}</span></div>
    {images.length ? <div className="approval-photo-grid" data-photo-count={images.length}>{images.map((image, index) => <ProjectPhoto key={`${image.url}-${index}`} image={image} onOpen={() => setSelected(index)} />)}</div> : <><p className="approval-photo-intro">No site photographs are attached. Capture dates and captions will accompany uploaded photos.</p><div className="approval-photo-slots">{[{ title: 'Before works', date: project.startDate, label: 'Planned start' }, { title: `${project.progress}% milestone`, date: project.submittedAt, label: 'Review submitted' }].map(slot => <figure key={slot.title}><div><Icon name="image" size={25} /><span>Photo not provided</span></div><figcaption><strong>{slot.title}</strong><span>{slot.label}: <time dateTime={slot.date}>{dateLabel(slot.date)}</time></span></figcaption></figure>)}</div></>}
    {currentImage && <Modal wide title="Project image" subtitle={project.name} onClose={() => setSelected(null)}><figure className="approval-image-viewer"><img src={currentImage.url} alt={currentImage.alt} /><figcaption>{currentImage.caption && <strong>{currentImage.caption}</strong>}{currentImage.capturedAt && <span>Captured <time dateTime={currentImage.capturedAt}>{dateLabel(currentImage.capturedAt)}</time></span>}{currentImage.capturedBy && <span>{currentImage.capturedBy}</span>}</figcaption></figure><footer className="approval-modal-footer"><span className="approval-image-counter">{selected! + 1} of {images.length}</span>{images.length > 1 && <><button type="button" className="approval-button" disabled={selected === 0} onClick={() => setSelected(value => Math.max(0, value! - 1))}><Icon name="back" size={15} />Previous</button><button type="button" className="approval-button" disabled={selected === images.length - 1} onClick={() => setSelected(value => Math.min(images.length - 1, value! + 1))}>Next<Icon name="arrow" size={15} /></button></>}<button type="button" className="approval-button" onClick={() => setSelected(null)}>Close</button></footer></Modal>}
  </section>
}
