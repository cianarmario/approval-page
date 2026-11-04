import { useId, useState, type FormEvent } from 'react'
import PortalHeader from '../../components/common/PortalHeader'
import { Link } from 'react-router-dom'
import PortalFooter from '../../components/common/PortalFooter'
import ProjectMap from '../../components/common/ProjectMap'
import ApprovalProjectImages from './ApprovalProjectImages'
import ApprovalMilestones from './ApprovalMilestones'
import ApprovalSupport from '../../components/common/ApprovalSupport'
import Icon from '../../components/ui/Icon'
import Modal from '../../components/ui/Modal'
import { currentApproval } from '../../data/demo'
import { currency, dateLabel, statusLabels } from '../../utils/format'
import type { Approver, DemoEmail, Project } from '../../types/approval'
import '../../styles/approval.css'

interface Props {
  project: Project
  reviewer?: Approver
  preview?: boolean
  readOnly?: boolean
  storageWarning?: boolean
  notification?: DemoEmail
  onDecision?: (approved: boolean, remarks: string) => void
}

export default function ApprovalProjectView({ project, reviewer, preview = false, readOnly = false, storageWarning, notification, onDecision }: Props) {
  const [decision, setDecision] = useState<'approve' | 'not-approve' | null>(null)
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const remarksId = useId()
  const approval = currentApproval(project)
  const pending = approval.status === 'pending'
  const approved = approval.status === 'approved'
  const completedDecision = approved || approval.status === 'changes-requested'
  const nextMilestone = project.progress < 100 ? project.progress + 25 : null

  function startDecision(value: 'approve' | 'not-approve') {
    setRemarks('')
    setError('')
    setDecision(value)
  }

  function submitDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!decision || !pending || readOnly || !onDecision) return
    if (decision === 'not-approve' && remarks.trim().length < 10) {
      setError('Please enter at least 10 characters describing the corrections needed.')
      return
    }
    try {
      onDecision(decision === 'approve', remarks.trim())
      setDecision(null)
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'The decision could not be recorded. Please try again.')
    }
  }

  return <div className="approval-page">
    <a className="skip-link" href="#project-review">Skip to project review</a>
    <PortalHeader onHelp={() => setShowHelp(true)} accessLabel={readOnly ? 'Public project record' : preview ? 'Frontend preview' : 'Verified approver'} />
    <main className="approval-main page-width" id="project-review">
      <div className="approval-breadcrumb">{readOnly ? <Link to="/public" state={{ previewProject: project }}>Public projects</Link> : <span>Project approvals</span>}<span aria-hidden="true">/</span><span>{project.id}</span><span className="approval-access"><Icon name={readOnly || preview ? 'info' : 'shield'} size={14} />{readOnly || preview ? 'Sample project' : 'Access verified'}</span></div>

      <article className="approval-record" aria-labelledby="project-title">
        <header className="approval-record-header">
          <div><p className="approval-eyebrow">{readOnly ? 'PROJECT DETAILS' : 'PROJECT APPROVAL'}</p><h1 id="project-title">{project.name}</h1><p className="approval-project-meta"><span>{project.id}</span><span aria-hidden="true">&middot;</span><span>{project.category}</span></p></div>
          <span className="approval-request-label"><Icon name="approval" size={18} /><span>{readOnly ? 'Milestone record' : 'Milestone review'}<strong>{project.progress}% {readOnly ? 'physical completion' : 'approval request'}</strong></span></span>
        </header>

        <div className="approval-record-status"><span className={`approval-status status-${approval.status}`}>{pending ? 'Awaiting milestone approval' : statusLabels[approval.status]}</span><span>Illustrative project information</span></div>

        <section className="approval-summary" aria-label="Project summary">
          <dl>
            <div><dt>Approved budget</dt><dd>{currency(project.budget)}</dd><p>Sample allocation &middot; PHP</p></div>
            <div className="approval-summary-progress"><dt>Physical completion</dt><dd>{project.progress}%</dd><div className="approval-progress-track" role="progressbar" aria-label="Reported physical completion" aria-valuenow={project.progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${project.progress}%` }} /></div></div>
            <div className="approval-summary-date"><dt>Planned start</dt><dd><time dateTime={project.startDate}>{dateLabel(project.startDate)}</time></dd></div>
            <div className="approval-summary-date"><dt>Target completion</dt><dd><time dateTime={project.targetDate}>{dateLabel(project.targetDate)}</time></dd></div>
          </dl>
        </section>

        <nav className="approval-section-nav" aria-label="Project sections"><a href="#project-overview">Project information</a><a href="#project-images">Images</a><a href="#project-location">Location</a><a href="#project-progress">Milestones</a><a href="#project-updates">Updates</a>{!readOnly && <a href="#project-decision">Decision</a>}</nav>

        <div className="approval-record-body">
          {storageWarning && <p className="approval-storage-warning" role="status">Browser storage is unavailable. This preview will keep your decision until the page is refreshed.</p>}
          <div className="approval-workspace">
            <div className="approval-primary-column">
              <section className="approval-section approval-information-section" id="project-overview" aria-labelledby="overview-heading">
                <div className="approval-section-heading"><h2 id="overview-heading">Project information</h2></div>
                <dl className="approval-information-grid">
                  <div className="approval-info-location"><dt>Location</dt><dd>{project.address}</dd></div>
                  <div className="approval-info-category"><dt>Category</dt><dd>{project.category}</dd></div>
                  <div className="approval-info-description"><dt>Description</dt><dd>{project.description}</dd></div>
                  <div className="approval-info-contractor"><dt>Contractor</dt><dd>{project.contractor}</dd></div>
                  <div className="approval-info-engineer"><dt>Project engineer</dt><dd>{project.engineer}</dd></div>
                  <div className="approval-info-office"><dt>Implementing office</dt><dd>City Engineering Office</dd></div>
                </dl>
              </section>

              <ApprovalProjectImages project={project} />

              <section className="approval-section approval-location-section" id="project-location" aria-labelledby="location-heading">
                <div className="approval-section-heading"><h2 id="location-heading">Project location</h2><button type="button" className="approval-icon-button" aria-label="Expand project map" title="Expand project map" onClick={() => setShowMap(true)}><Icon name="expand" size={18} /></button></div>
                <p className="approval-map-intro">Approximate location for this sample project. Drag to move. Pinch with two fingers or double-tap to zoom.</p>
                <ProjectMap project={project} />
              </section>

              <ApprovalMilestones project={project} />

              <section className="approval-section" id="project-updates" aria-labelledby="updates-heading">
                <div className="approval-section-heading"><h2 id="updates-heading">Project updates</h2><span>{project.updates.length} records</span></div>
                <ol className="approval-updates">{project.updates.map(update => <li key={`${update.date}-${update.title}`}><time dateTime={update.date}>{dateLabel(update.date)}</time><div><h3>{update.title}</h3><p>{update.detail}</p></div></li>)}</ol>
              </section>
            </div>

            <aside className="approval-secondary-column" aria-label={readOnly ? 'Milestone decision record' : 'Milestone review and decision'}>
              <section className="approval-decision-section" id="project-decision" tabIndex={-1} aria-labelledby="decision-heading">
                <p className="approval-decision-eyebrow">APPROVAL WORKFLOW</p>
                <h2 id="decision-heading">{readOnly ? 'Approval record' : 'Review & decision'}</h2>
                <div className="approval-current-milestone"><span>Current milestone</span><strong>{project.progress}%</strong></div>
                <dl className="approval-reviewer"><div><dt>Assigned approver</dt><dd>{reviewer?.name ?? 'Not yet assigned'}<span>{reviewer?.role ?? 'Awaiting assignment'}</span></dd></div><div><dt>Submitted for review</dt><dd><time dateTime={project.submittedAt}>{dateLabel(project.submittedAt)}</time></dd></div></dl>
                {pending && !readOnly ? <>
                  <p>Review the project details and submitted work before recording your decision.</p>
                  <div className="approval-decision-actions"><button type="button" className="approval-button approval-button-approve" onClick={() => startDecision('approve')}><Icon name="check" size={16} />Approve</button><button type="button" className="approval-button approval-button-reject" onClick={() => startDecision('not-approve')}><Icon name="close" size={15} />Not Approve</button></div>
                  <p className="approval-decision-hint">Not Approve requires a reason or corrections.</p>
                  <div className="approval-next-stage"><Icon name="arrow" size={16} /><p>{nextMilestone ? <>Approval allows work to proceed toward the <strong>{nextMilestone}% milestone</strong>.</> : 'Approval confirms the final project milestone.'}</p></div>
                </> : completedDecision ? <div className={`approval-decision-result ${approved ? 'is-approved' : 'needs-changes'}`} role="status"><Icon name={approved ? 'checkCircle' : 'info'} size={23} /><div><h3>{approved ? `${project.progress}% milestone approved` : 'Changes requested'}</h3><p>{approved ? nextMilestone ? `The project may proceed toward the ${nextMilestone}% milestone.` : 'The final project milestone is complete.' : 'The project team can make corrections before requesting another review.'}</p>{approval.decidedAt && <time dateTime={approval.decidedAt}>{dateLabel(approval.decidedAt, true)}</time>}</div></div> : <p>{pending ? 'This milestone is awaiting review by its assigned approver.' : 'This milestone is awaiting an approver assignment.'}</p>}
                {approval.remarks && <div className="approval-recorded-remarks"><h3>Reviewer remarks</h3><p>{approval.remarks}</p></div>}
                {!readOnly && notification && completedDecision && <details className="approval-notification-preview"><summary><Icon name="mail" size={14} />Notification preview</summary><p>A simulated notification has been prepared for the admin and project engineers. No email is sent.</p><dl><div><dt>To</dt><dd>{notification.to}</dd></div><div><dt>Subject</dt><dd>{notification.subject}</dd></div></dl></details>}
              </section>
              <div className="approval-scope-note"><Icon name="shield" size={17} /><p>{readOnly ? 'Milestone decisions are recorded by the assigned authorized approver.' : <>Your decision applies to this project's <strong>{project.progress}% milestone</strong> only.</>}</p></div>
            </aside>
          </div>
        </div>
      </article>
      <p className="approval-demo-note"><Icon name="info" size={14} />{readOnly ? 'Local public-site preview with illustrative project information.' : <>Frontend preview with sample project data. Decisions and email notifications are simulated{preview ? ' for this preview session' : ' in this browser'}.</>}</p>
    </main>
    <PortalFooter />

    {showMap && <Modal wide className="approval-map-dialog" backLabel="Back to project" title="Project location" subtitle={project.name} onClose={() => setShowMap(false)}><div className="approval-expanded-map"><ProjectMap project={project} expanded /></div></Modal>}

    {decision && <Modal title={decision === 'approve' ? `Approve the ${project.progress}% milestone?` : 'Not approve this milestone'} subtitle={project.name} onClose={() => setDecision(null)}>
      <form onSubmit={submitDecision}>
        <div className="approval-modal-body"><p>{decision === 'approve' ? nextMilestone ? `Confirm that the submitted work satisfies the ${project.progress}% milestone requirements. Approval allows the project to proceed toward ${nextMilestone}%.` : 'Confirm that the submitted work satisfies the final milestone requirements. This records the final project approval.' : 'Explain the issues or corrections required. Your remarks will accompany the decision for the administrator and project engineers.'}</p>
          <label htmlFor={remarksId}>{decision === 'approve' ? 'Remarks (optional)' : 'Reason for not approving'}{decision === 'not-approve' && <span aria-hidden="true"> *</span>}</label>
          <textarea id={remarksId} value={remarks} onChange={event => { setRemarks(event.target.value); setError('') }} rows={4} maxLength={2000} minLength={decision === 'not-approve' ? 10 : undefined} required={decision === 'not-approve'} placeholder={decision === 'approve' ? 'Add any notes for the project team.' : 'Describe what needs to be corrected before another review.'} aria-describedby={`${remarksId}-hint ${remarksId}-error`} />
          <div className="approval-remarks-hint" id={`${remarksId}-hint`}><span>{decision === 'not-approve' ? 'At least 10 characters required.' : 'Include any conditions or notes, if needed.'}</span><span>{remarks.length.toLocaleString()}/2,000</span></div>
          <p className="approval-modal-error" role="alert" id={`${remarksId}-error`}>{error}</p>
          <p className="approval-modal-preview">Frontend preview: the decision updates sample data and prepares a simulated notification.</p>
        </div>
        <footer className="approval-modal-footer"><button className="approval-button" type="button" onClick={() => setDecision(null)}>Cancel</button><button className={`approval-button ${decision === 'approve' ? 'approval-button-approve' : 'approval-button-reject'}`} type="submit"><Icon name={decision === 'approve' ? 'check' : 'close'} size={16} />{decision === 'approve' ? 'Confirm approval' : 'Submit decision'}</button></footer>
      </form>
    </Modal>}

    {showHelp && <Modal title="About this project review" onClose={() => setShowHelp(false)}><div className="approval-modal-body"><p>Review the project details, reported progress, milestone assignments, and location before making your decision.</p><ul><li><strong>Approve</strong> confirms the current milestone and permits work toward the next stage.</li><li><strong>Not Approve</strong> requires remarks so the project team knows what to correct.</li><li>Approval does not automatically change the reported physical progress.</li><li>Final approval is recorded by the Mayor, CEO, or President assigned by the administrator.</li></ul><ApprovalSupport projectId={project.id} /></div><footer className="approval-modal-footer"><button type="button" className="approval-button" onClick={() => setShowHelp(false)}>Close</button></footer></Modal>}
  </div>
}

