import { useState, type FormEvent } from 'react'
import { usePortal } from '../../app/PortalContext'
import { approvers, getApprover } from '../../data/demo'
import { FINAL_ROLES, type Assignments } from '../../services/approvalWorkflow'
import type { Project } from '../../types/approval'
import Icon from '../../components/ui/Icon'
import Modal from '../../components/ui/Modal'

export default function AssignmentModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const { assign } = usePortal()
  const [assignments, setAssignments] = useState(() => Object.fromEntries(project.milestones.map(m => [m.level, m.approverId])) as Assignments)
  const [error, setError] = useState('')
  function save(event: FormEvent) {
    event.preventDefault()
    try { assign(project.id, assignments); onClose() } catch (issue) { setError((issue as Error).message) }
  }
  return <Modal title="Assign milestone approvers" subtitle="Set the approval workflow for this project." onClose={onClose} wide><form onSubmit={save}><div className="modal-body"><div className="assignment-project"><span className="project-icon"><Icon name="building" size={24}/></span><div><small>{project.id}</small><h3>{project.name}</h3><p><Icon name="location" size={13}/>{project.address}</p></div><span className="milestone-chip">{project.progress}% progress</span></div><div className="section-overline">APPROVAL WORKFLOW</div><div className="assignment-list">{project.milestones.map(m => {
    const locked = m.status === 'approved'
    const person = getApprover(assignments[m.level])
    return <div className={`assignment-row ${m.level === project.progress ? 'current' : ''}`} key={m.level}><div className={`milestone-node ${locked ? 'complete' : ''}`}>{locked ? <Icon name="check" size={18}/> : <b>{m.level}<small>%</small></b>}</div><div className="assignment-field"><div className="assignment-label"><label htmlFor={`approver-${m.level}`}>{m.level === 100 ? 'Final approval' : `${m.level}% milestone approver`}</label>{locked ? <span className="tag tag-green">Approved · locked</span> : m.level === project.progress ? <span className="tag tag-blue">Current milestone</span> : <span className="muted small">Upcoming</span>}</div><select id={`approver-${m.level}`} value={assignments[m.level]} disabled={locked} required onChange={e => setAssignments({ ...assignments, [m.level]: e.target.value })}><option value="">Select an approver</option>{approvers.filter(p => m.level !== 100 || FINAL_ROLES.includes(p.role)).map(p => <option key={p.id} value={p.id}>{p.name} — {p.role}</option>)}</select><small className="field-hint">{m.level === 100 ? 'Authorized final signatory: Mayor, CEO, or President.' : person ? person.email : 'Choose an engineer or authorized official.'}</small></div></div>
  })}</div><div className="info-callout"><Icon name="mail" size={21}/><div><b>An invitation for the active milestone</b><p>Saving prepares a demo email with a review link and a one-time code. Future approvers are saved for their milestones.</p></div></div>{error && <p className="form-error" role="alert">{error}</p>}</div><footer className="modal-footer"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit"><Icon name="mail" size={17}/>{project.milestones.find(m => m.level === project.progress)?.status === 'approved' ? 'Save assignments' : 'Save & prepare invitation'}</button></footer></form></Modal>
}
