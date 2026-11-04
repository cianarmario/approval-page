import { useEffect, useRef } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { usePortal } from '../app/PortalContext'
import { currentApproval, getApprover } from '../data/demo'
import PortalHeader from '../components/common/PortalHeader'
import PortalFooter from '../components/common/PortalFooter'
import Icon from '../components/ui/Icon'
import { activeInvitation } from '../services/approvalWorkflow'
import type { Project } from '../types/approval'
import { dateLabel } from '../utils/format'
import '../styles/approval.css'

export default function ConfirmationPage() {
  const { invitationId = '' } = useParams()
  const location = useLocation()
  const { state, isVerified } = usePortal()
  const heading = useRef<HTMLHeadingElement>(null)
  const previewProject = (location.state as { previewProject?: Project } | null)?.previewProject
  const invitation = activeInvitation(state, invitationId)
  const project = previewProject ?? state.projects.find(item => item.id === invitation?.projectId)
  const approval = project ? currentApproval(project) : undefined
  const approved = approval?.status === 'approved'
  const completed = approved || approval?.status === 'changes-requested'

  useEffect(() => {
    document.title = `${approved ? 'Milestone approved' : 'Decision recorded'} | Legazpi Project Monitoring`
    window.scrollTo(0, 0)
    heading.current?.focus({ preventScroll: true })
  }, [approved])

  if (!project || !approval || !completed || (!previewProject && !isVerified(invitationId))) return <Navigate to={`/verify/${encodeURIComponent(invitationId)}`} replace />
  const reviewer = getApprover(approval.approverId)
  const navigationState = previewProject ? { previewProject } : undefined

  return <div className="approval-page">
    <PortalHeader accessLabel="Decision recorded" />
    <main className="approval-confirmation-main page-width">
      <section className={`approval-confirmation ${approved ? 'is-approved' : 'needs-changes'}`} aria-labelledby="confirmation-heading">
        <span className="approval-confirmation-symbol"><Icon name={approved ? 'check' : 'info'} size={28} /></span>
        <p className="approval-eyebrow">MILESTONE DECISION RECORDED</p>
        <h1 id="confirmation-heading" ref={heading} tabIndex={-1}>{approved ? `${approval.level}% milestone approved` : 'Changes requested'}</h1>
        <p className="approval-confirmation-description">{approved ? approval.level === 100 ? 'The final project milestone has been approved.' : `The ${approval.level}% milestone is approved. The project may proceed toward the ${approval.level + 25}% milestone.` : 'Your remarks have been recorded. The project team can address the issues before requesting another review.'}</p>
        <div className="approval-confirmation-receipt">
          <header><span>{project.id}</span><h2>{project.name}</h2><p><Icon name="location" size={15} />{project.address}</p></header>
          <dl><div><dt>Decision</dt><dd>{approved ? 'Approved' : 'Changes requested'}</dd></div><div><dt>Reviewed by</dt><dd>{reviewer?.name ?? 'Assigned approver'}</dd></div><div><dt>Milestone</dt><dd>{approval.level}%{approval.level === 100 ? ' · Final approval' : ''}</dd></div><div><dt>Recorded on</dt><dd>{approval.decidedAt ? <time dateTime={approval.decidedAt}>{dateLabel(approval.decidedAt, true)}</time> : 'Recorded in this preview'}</dd></div></dl>
          {approval.remarks && <div className="approval-confirmation-remarks"><h3>Reviewer remarks</h3><p>{approval.remarks}</p></div>}
          <p className="approval-confirmation-notification"><Icon name="mail" size={17} /><span>A simulated notification is ready for the administrator and project engineers. No email has been sent.</span></p>
        </div>
        <div className="approval-confirmation-actions"><Link className="approval-button" to="/public" state={navigationState}>Close</Link><Link className="approval-button approval-button-approve" to={`/projects/${project.id}`} state={navigationState}>{approved ? 'Explore Approved Project' : 'Explore Project'}<Icon name="arrow" size={16} /></Link></div>
        <p className="approval-confirmation-footnote">Frontend preview &middot; physical completion remains {project.progress}%.</p>
      </section>
    </main>
    <PortalFooter />
  </div>
}
