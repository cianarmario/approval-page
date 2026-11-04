import { useState } from 'react'
import { Link } from 'react-router-dom'
import { approvers, projectStatus } from '../data/demo'
import { usePortal } from '../app/PortalContext'
import { ActivityList, ApprovalStats } from './ApprovalsPage'
import Icon from '../components/ui/Icon'
import Modal from '../components/ui/Modal'
import { currency } from '../utils/format'

export function OverviewPage() {
  const { state, openInbox } = usePortal()
  return <><div className="page-heading"><div><div className="eyebrow">YOUR CITY, MOVING FORWARD</div><h1>Approval overview</h1><p>A shared view of project progress and decisions that keep infrastructure moving.</p></div><Link to="/admin/approvals" className="button button-primary">Manage approvals <Icon name="arrow" size={16}/></Link></div><ApprovalStats/><section className="overview-feature"><div><span className="eyebrow">BUILDING A BETTER LEGAZPI</span><h2>Progress you can see.<br/>Decisions you can trace.</h2><p>{state.projects.length} sample projects representing {currency(state.projects.reduce((sum, p) => sum + p.budget, 0))} in planned infrastructure investment.</p><button className="button button-white" onClick={openInbox}>Try a reviewer invitation <Icon name="arrow" size={16}/></button></div><div className="overview-rings"><span>{state.projects.filter(p => projectStatus(p) === 'approved').length}<small>approved<br/>milestone</small></span></div></section><section className="panel"><div className="panel-heading"><h2>Latest approval activity</h2><Link to="/admin/activity" className="text-button">View activity log <Icon name="arrow" size={15}/></Link></div><ActivityList limit={5}/></section></>
}

export function ApproversPage() {
  const { state } = usePortal()
  const [search, setSearch] = useState('')
  const people = approvers.filter(p => `${p.name} ${p.role} ${p.email}`.toLowerCase().includes(search.toLowerCase()))
  return <><div className="page-heading"><div><div className="eyebrow">AUTHORIZED REVIEWERS</div><h1>Approver directory</h1><p>Sample officials available for milestone assignment.</p></div></div><div className="directory-toolbar"><label className="search-field"><Icon name="search" size={18}/><input aria-label="Search approvers" placeholder="Search by name, role, or email..." value={search} onChange={e => setSearch(e.target.value)}/></label><span className="tag tag-blue">{people.length} approvers</span></div><div className="approver-grid">{people.map(person => <article key={person.id} className="panel approver-card"><span className={`avatar avatar-large avatar-${person.color}`}>{person.initials}</span><h2>{person.name}</h2><span className="muted">{person.role}</span><p><Icon name="mail" size={15}/>{person.email}</p><div><span>{state.projects.reduce((count, p) => count + p.milestones.filter(m => m.approverId === person.id && m.status !== 'approved').length, 0)} milestone assignments</span>{['Mayor', 'CEO', 'President'].includes(person.role) && <span className="tag tag-blue">Final signatory</span>}</div></article>)}</div>{!people.length && <div className="empty-state"><h3>No matching approvers</h3><p>Try a different name or role.</p></div>}<div className="info-callout"><Icon name="info"/><p>This directory uses fictional officials and example.com addresses. Real personnel and directory management can be connected when the backend is added.</p></div></>
}

export function ActivityPage() {
  const { reset } = usePortal()
  const [resetOpen, setResetOpen] = useState(false)
  return <><div className="page-heading"><div><div className="eyebrow">ACCOUNTABILITY AT EVERY STEP</div><h1>Activity log</h1><p>Assignments, verification requests, and approval decisions from this browser’s demo.</p></div><button className="button button-secondary" onClick={() => setResetOpen(true)}><Icon name="refresh" size={16}/>Reset demo</button></div><section className="panel full-activity"><div className="panel-heading"><h2>Approval history</h2><span className="tag tag-blue">Local demo records</span></div><ActivityList/></section>{resetOpen && <Modal title="Reset the demo workspace?" subtitle="This clears only the sample changes stored in this browser." onClose={() => setResetOpen(false)}><div className="modal-body"><p>Your assignments, sample decisions, and simulated emails will be replaced with the initial demo data. You can start the approval flow again.</p></div><footer className="modal-footer"><button className="button button-secondary" onClick={() => setResetOpen(false)}>Keep my changes</button><button className="button button-primary" onClick={() => { reset(); setResetOpen(false) }}>Reset demo</button></footer></Modal>}</>
}
