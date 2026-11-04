import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePortal } from '../app/PortalContext'
import { currentApproval, getApprover, projectStatus } from '../data/demo'
import Icon from '../components/ui/Icon'
import StatusBadge from '../components/ui/StatusBadge'
import AssignmentModal from '../features/approvals/AssignmentModal'
import { MILESTONES, type ApprovalStatus, type Project } from '../types/approval'
import { dateLabel } from '../utils/format'
import { exportApprovals } from '../utils/export'

export function ApprovalStats() {
  const { state } = usePortal()
  const stats: { status: ApprovalStatus; label: string; icon: string; description: string; color: string }[] = [
    { status: 'pending', label: 'Pending review', icon: 'clock', description: 'Awaiting an approver’s decision', color: 'blue' },
    { status: 'unassigned', label: 'Needs assignment', icon: 'users', description: 'Assign an authorized approver', color: 'orange' },
    { status: 'approved', label: 'Approved milestones', icon: 'checkCircle', description: 'Ready for the next project stage', color: 'green' },
    { status: 'changes-requested', label: 'Changes requested', icon: 'refresh', description: 'Requires review and correction', color: 'red' },
  ]
  return <div className="approval-stats">{stats.map(item => <article key={item.status} className={`stat-card stat-${item.color}`}><div className="stat-top"><span>{item.label}</span><span className="stat-icon"><Icon name={item.icon} size={19}/></span></div><b>{state.projects.filter(p => projectStatus(p) === item.status).length.toString().padStart(2, '0')}</b><small>{item.description}</small></article>)}</div>
}

export function ActivityList({ limit }: { limit?: number }) {
  const { state } = usePortal()
  const activity = limit ? state.activity.slice(0, limit) : state.activity
  return <div className="activity-list">{activity.map(item => <article key={item.id}><span className={`activity-icon ${item.type}`}><Icon name={item.type === 'approved' ? 'check' : item.type === 'changes-requested' ? 'refresh' : 'mail'} size={16}/></span><div><b>{item.title}</b><p>{item.detail}</p><Link to={`/projects/${item.projectId}`}>{item.projectId}</Link></div><time>{dateLabel(item.createdAt)}</time></article>)}</div>
}

export default function ApprovalsPage({ projectsView = false }: { projectsView?: boolean }) {
  const { state, openInbox, notify } = usePortal()
  const navigate = useNavigate()
  const [milestone, setMilestone] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [order, setOrder] = useState('newest')
  const [page, setPage] = useState(1)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const filtered = state.projects.filter(project => (!milestone || project.progress === milestone) && (status === 'all' || projectStatus(project) === status) && `${project.name} ${project.id} ${project.barangay}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => order === 'newest' ? b.submittedAt.localeCompare(a.submittedAt) : a.submittedAt.localeCompare(b.submittedAt))
  const pageSize = 5
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const resetFilters = () => { setSearch(''); setStatus('all'); setMilestone(0); setPage(1) }
  return <>
    <div className="page-heading"><div><div className="eyebrow">CITY ENGINEERING OFFICE</div><h1>{projectsView ? 'Project registry' : 'Project approvals'}<span className="heading-count">{state.projects.length}</span></h1><p>{projectsView ? 'Explore infrastructure projects and their milestone approval workflows.' : 'Keep every project moving with clear, accountable milestone approvals.'}</p></div><button className="button button-secondary" onClick={() => { exportApprovals(filtered); notify('Approval report downloaded.') }}><Icon name="download" size={17}/>Export report</button></div>
    <ApprovalStats/>
    <section className="panel approvals-panel" aria-labelledby="queue-title"><header className="panel-heading"><div><h2 id="queue-title">{projectsView ? 'Infrastructure projects' : 'Approval queue'}</h2><p>Review milestone submissions and manage project approvers.</p></div><span className="live-indicator"><i/>Browser demo</span></header>
      <div className="milestone-tabs" aria-label="Filter by current milestone"><button className={!milestone ? 'active' : ''} onClick={() => { setMilestone(0); setPage(1) }}>All milestones <span>{state.projects.length}</span></button>{MILESTONES.map(level => <button key={level} className={milestone === level ? 'active' : ''} onClick={() => { setMilestone(level); setPage(1) }}>{level}% milestone <span>{state.projects.filter(p => p.progress === level).length}</span></button>)}</div>
      <div className="table-toolbar"><label className="search-field"><Icon name="search" size={18}/><input aria-label="Search projects" placeholder="Search project name, ID, or barangay..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}/>{search && <button className="icon-button" aria-label="Clear search" onClick={() => setSearch('')}><Icon name="close" size={14}/></button>}</label><label className="filter-select"><Icon name="filter" size={16}/><select aria-label="Filter approval status" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}><option value="all">All statuses</option><option value="pending">Pending review</option><option value="unassigned">Needs assignment</option><option value="approved">Approved</option><option value="changes-requested">Changes requested</option></select></label><select className="sort-select" aria-label="Sort projects" value={order} onChange={e => { setOrder(e.target.value); setPage(1) }}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select>{(search || status !== 'all' || milestone !== 0) && <button className="text-button" onClick={resetFilters}>Reset</button>}</div>
      <div className="table-scroll"><table className="project-table"><thead><tr><th>PROJECT NAME</th><th>CURRENT MILESTONE</th><th>ASSIGNED APPROVER</th><th>APPROVAL STATUS</th><th>ACTION</th></tr></thead><tbody>{rows.map(project => {
        const current = currentApproval(project)
        const person = getApprover(current.approverId)
        const invitation = [...state.invitations].reverse().find(inv => inv.projectId === project.id && !inv.cancelled && inv.milestone === project.progress)
        return <tr key={project.id}><td><div className="project-cell"><span className={`project-icon category-${project.category === 'Flood Control' ? 'teal' : project.category === 'Public Buildings' ? 'purple' : 'blue'}`}><Icon name={project.category === 'Public Buildings' ? 'building' : project.category === 'Flood Control' ? 'location' : 'folder'} size={21}/></span><div><Link to={`/projects/${project.id}`} className="project-name">{project.name}</Link><small>{project.id} <i/> Brgy. {project.barangay}</small></div></div></td><td><div className="milestone-table"><b>{project.progress}% <span>{project.progress === 100 ? 'Final milestone' : 'milestone'}</span></b><div className="mini-progress"><span style={{ width: `${project.progress}%` }}/></div></div></td><td>{person ? <div className="person-cell"><span className={`avatar avatar-${person.color}`}>{person.initials}</span><div><b>{person.name}</b><small>{person.role}</small></div></div> : <span className="not-assigned"><Icon name="user" size={15}/>Not assigned</span>}</td><td><StatusBadge status={current.status}/><small className="submitted-date">Submitted {dateLabel(project.submittedAt)}</small></td><td><div className="row-actions"><button className={`button button-small ${current.status === 'unassigned' ? 'button-primary' : 'button-outline'}`} onClick={() => setSelectedProject(project)}>{current.status === 'unassigned' ? 'Assign approvers' : current.status === 'changes-requested' ? 'Request again' : 'Manage'}<Icon name={current.status === 'unassigned' ? 'users' : 'chevron'} size={14}/></button>{invitation && current.status === 'pending' && <button className="icon-button invitation-shortcut" title="Open reviewer invitation" aria-label={`Open invitation for ${project.name}`} onClick={() => navigate(`/verify/${invitation.id}`)}><Icon name="external" size={15}/></button>}</div></td></tr>
      })}</tbody></table>{!rows.length && <div className="empty-state"><Icon name="search" size={34}/><h3>No projects found</h3><p>Try another search or clear your filters.</p><button className="button button-secondary" onClick={resetFilters}>Clear filters</button></div>}</div>
      <footer className="table-footer"><span>Showing <b>{filtered.length ? (safePage - 1) * pageSize + 1 : 0}–{Math.min(safePage * pageSize, filtered.length)}</b> of <b>{filtered.length}</b> projects</span><div className="pagination"><button className="icon-button" aria-label="Previous page" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}><Icon name="back" size={15}/></button>{Array.from({ length: totalPages }, (_, i) => <button key={i} className={safePage === i + 1 ? 'active' : ''} aria-label={`Page ${i + 1}`} aria-current={safePage === i + 1 ? 'page' : undefined} onClick={() => setPage(i + 1)}>{i + 1}</button>)}<button className="icon-button" aria-label="Next page" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}><Icon name="arrow" size={15}/></button></div></footer>
    </section>
    <div className="bottom-panels"><section className="panel workflow-panel"><div className="panel-heading"><h2>A simple, secure approval flow</h2><Icon name="shield" size={19}/></div><div className="workflow-steps">{[['users', 'Assign approvers', 'The right person for each milestone.'], ['mail', 'Invite & verify', 'An email link and a one-time code.'], ['checkCircle', 'Review & decide', 'A clear decision with a full record.']].map(([icon, title, text], i) => <div key={icon}><span><Icon name={icon} size={18}/></span><b><small>0{i + 1}</small>{title}</b><p>{text}</p></div>)}</div><button className="text-button" onClick={openInbox}>Explore a demo invitation <Icon name="arrow" size={15}/></button></section><section className="panel recent-panel"><div className="panel-heading"><h2>Recent activity</h2><Link className="text-button" to="/admin/activity">View all <Icon name="arrow" size={14}/></Link></div><ActivityList limit={2}/></section></div>
    {selectedProject && <AssignmentModal project={state.projects.find(p => p.id === selectedProject.id)!} onClose={() => setSelectedProject(null)}/>}
  </>
}
