import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { usePortal } from '../app/PortalContext'
import PortalHeader from '../components/common/PortalHeader'
import PortalFooter from '../components/common/PortalFooter'
import Icon from '../components/ui/Icon'
import { currentApproval } from '../data/demo'
import type { Project } from '../types/approval'
import { currency, statusLabels } from '../utils/format'
import '../styles/approval.css'

export default function PublicProjectsPage() {
  const { state } = usePortal()
  const location = useLocation()
  const previewProject = (location.state as { previewProject?: Project } | null)?.previewProject
  const [search, setSearch] = useState('')
  const projects = state.projects.map(project => project.id === previewProject?.id ? previewProject : project)
    .filter(project => `${project.name} ${project.barangay} ${project.id}`.toLowerCase().includes(search.trim().toLowerCase()))
  useEffect(() => { document.title = 'Public projects | Legazpi Project Monitoring'; window.scrollTo(0, 0) }, [])

  return <div className="approval-page"><PortalHeader accessLabel="Public project information" />
    <main className="approval-public-main page-width">
      <header className="approval-public-heading"><p className="approval-eyebrow">PUBLIC INFRASTRUCTURE PROJECT MONITORING</p><h1>Infrastructure projects in Legazpi City</h1><p>View project information, locations, physical progress, and milestone approval records.</p></header>
      <div className="approval-public-toolbar"><label htmlFor="public-project-search">Find a project<div><Icon name="search" size={17} /><input id="public-project-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Project name, barangay, or reference" /></div></label><span aria-live="polite">{projects.length} sample {projects.length === 1 ? 'project' : 'projects'}</span></div>
      <div className="approval-public-grid">{projects.map(project => <article key={project.id} className="approval-public-card"><header><span>{project.id}</span><span className={`approval-table-status status-${currentApproval(project).status}`}>{statusLabels[currentApproval(project).status]}</span></header><h2><Link to={`/projects/${project.id}`} state={previewProject ? { previewProject } : undefined}>{project.name}</Link></h2><p><Icon name="location" size={14} />{project.address}</p><dl><div><dt>Physical completion</dt><dd>{project.progress}%</dd></div><div><dt>Approved budget</dt><dd>{currency(project.budget)}</dd></div></dl><div className="approval-progress-track" role="progressbar" aria-label={`${project.name} physical completion`} aria-valuenow={project.progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${project.progress}%` }} /></div><Link className="approval-public-link" to={`/projects/${project.id}`} state={previewProject ? { previewProject } : undefined}>View project<Icon name="arrow" size={15} /></Link></article>)}</div>
      {!projects.length && <div className="approval-public-empty"><h2>No matching projects</h2><p>Try another name, barangay, or project reference.</p><button type="button" className="approval-button" onClick={() => setSearch('')}>Clear search</button></div>}
      <p className="approval-demo-note"><Icon name="info" size={14} />Local public-site preview. Project data and approval records are illustrative.</p>
    </main><PortalFooter /></div>
}
