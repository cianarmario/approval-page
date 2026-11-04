import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import logo from '../assets/images/city-engineering-logo.png'
import Icon from '../components/ui/Icon'
import Modal from '../components/ui/Modal'
import { usePortal } from '../app/PortalContext'
import { projectStatus } from '../data/demo'

const nav = [
  { to: '/admin/overview', label: 'Overview', icon: 'grid' },
  { to: '/admin/projects', label: 'Projects', icon: 'folder' },
  { to: '/admin/approvals', label: 'Approvals', icon: 'approval' },
  { to: '/admin/approvers', label: 'Approver directory', icon: 'users' },
  { to: '/admin/activity', label: 'Activity log', icon: 'history' },
]

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const { state, openInbox, storageWarning } = usePortal()
  const path = useLocation().pathname
  const title = nav.find(item => item.to === path)?.label ?? 'Approvals'
  const pending = state.projects.filter(p => projectStatus(p) === 'pending' || projectStatus(p) === 'unassigned').length
  return <div className="admin-app">
    <a className="skip-link" href="#main-content">Skip to content</a>
    {mobileOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <aside className={`app-sidebar ${mobileOpen ? 'is-open' : ''}`}>
      <Link className="sidebar-brand" to="/admin/approvals" onClick={() => setMobileOpen(false)}><span className="brand-mark"><img src={logo} alt="City Engineering Office" /></span><div><b>Legazpi City</b><span>Project Monitoring System</span></div></Link>
      <div className="sidebar-account"><span className="avatar avatar-outline"><Icon name="user" size={19} /></span><div><b>Admin workspace</b><small>City Engineering Office</small></div><span className="online-dot" /></div>
      <nav className="sidebar-nav" aria-label="Main navigation"><p className="nav-label">PROJECT MANAGEMENT</p>{nav.slice(0, 3).map(item => <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'nav-item is-active' : 'nav-item'} onClick={() => setMobileOpen(false)}><Icon name={item.icon} size={19} /><span>{item.label}</span>{item.label === 'Approvals' && <b className="nav-count">{pending}</b>}</NavLink>)}<p className="nav-label">ADMINISTRATION</p>{nav.slice(3).map(item => <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'nav-item is-active' : 'nav-item'} onClick={() => setMobileOpen(false)}><Icon name={item.icon} size={19}/><span>{item.label}</span></NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-help"><span className="help-icon"><Icon name="shield" size={21}/></span><b>Every milestone matters.</b><p>Accountable approvals. Better infrastructure for our city.</p><button onClick={() => setHelpOpen(true)}>How approvals work <Icon name="arrow" size={15}/></button></div><Link className="sidebar-public" to="/public"><Icon name="external" size={17}/>Visit public website</Link><small>LEGAZPI CITY · ALBAY, PHILIPPINES</small></div>
    </aside>
    <div className="admin-workspace"><header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" aria-label="Open navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}><Icon name="menu"/></button><span>Project management</span><Icon name="chevron" size={13}/><b>{title}</b></div><div className="topbar-right"><span className="date-label"><Icon name="calendar" size={16}/>{new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' }).format(new Date())}</span><button className="inbox-button" onClick={openInbox}><Icon name="mail" size={18}/><span>Demo inbox</span><b>{state.emails.length}</b></button><span className="topbar-divider"/><span className="avatar avatar-blue">AD</span></div></header>
      <div className="demo-banner"><Icon name="info" size={15}/><span>Frontend preview <i/>Sample projects, simulated emails, and demo verification codes.</span><button onClick={openInbox}>Try the approval flow <Icon name="arrow" size={14}/></button></div>
      {storageWarning && <div className="alert alert-warning">Browser storage is unavailable. Changes will last for this visit only.</div>}
      <main id="main-content" className="page-content"><Outlet/></main><footer className="workspace-footer"><span>© {new Date().getFullYear()} Legazpi City · City Engineering Office</span><span>Public Infrastructure Project Monitoring System</span></footer>
    </div>
    {helpOpen && <Modal title="A clear path to every approval" subtitle="How milestone approval works" onClose={() => setHelpOpen(false)}><div className="modal-body help-steps">{[['Assign the right people', 'Choose an authorized approver for 25%, 50%, 75%, and 100%. The final milestone is reserved for a Mayor, CEO, or President.'], ['Prepare an invitation', 'The active milestone receives a simulated email containing a project preview, a review link, and a code valid for 10 minutes.'], ['Verify and review', 'Open the invitation, enter its code, and review the project details, location, and milestone history.'], ['Record a decision', 'Approve the milestone or request changes with remarks. The admin view and demo notifications update immediately.']].map(([heading, detail], index) => <div key={heading}><span>{index + 1}</span><section><h3>{heading}</h3><p>{detail}</p></section></div>)}</div><footer className="modal-footer"><button className="button button-primary" onClick={() => { setHelpOpen(false); openInbox() }}>Open demo inbox <Icon name="arrow" size={16}/></button></footer></Modal>}
  </div>
}
