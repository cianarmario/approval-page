import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePortal } from '../../app/PortalContext'
import Modal from '../../components/ui/Modal'
import Icon from '../../components/ui/Icon'
import { dateLabel } from '../../utils/format'
import { getApprover } from '../../data/demo'
import { approvalPreview } from '../../utils/preview'

export default function DemoInbox() {
  const { state, closeInbox } = usePortal()
  const [selectedId, setSelectedId] = useState(state.emails[0]?.id)
  const selected = state.emails.find(item => item.id === selectedId) ?? state.emails[0]
  const project = state.projects.find(item => item.id === selected?.projectId)
  const invitation = state.invitations.find(item => item.id === selected?.invitationId)
  const obsolete = invitation?.cancelled || (selected?.code && selected.code !== invitation?.code)
  return <Modal title="Demo email inbox" subtitle="Simulated messages only. No emails are sent." onClose={closeInbox} wide><div className="inbox-layout"><nav className="email-list" aria-label="Demo messages">{state.emails.map(email => <button key={email.id} className={selected?.id === email.id ? 'selected' : ''} onClick={() => setSelectedId(email.id)}><span className="email-type"><Icon name={email.type === 'invitation' ? 'mail' : 'checkCircle'} size={16}/>{email.type === 'invitation' ? 'Approval invitation' : 'Decision notification'}</span><b>{email.subject}</b><small>{email.to}</small><time>{dateLabel(email.createdAt, true)}</time></button>)}</nav>{selected && project ? <article className="email-content"><div className="email-meta"><span>From: City Engineering Office &lt;demo@example.com&gt;</span><span>To: {selected.to}</span><span>{dateLabel(selected.createdAt, true)}</span></div><h3>{selected.subject}</h3><p>Hello {invitation ? getApprover(invitation.approverId)?.name : 'project team'},</p><p>{selected.message}</p><img className="approval-email-preview" src={approvalPreview(project)} alt={`Preview of the approval page for ${project.name}`}/><b className="email-project-title">{project.name}</b><p className="muted small">{project.id} · {project.address}</p>{selected.type === 'invitation' && <><div className={`email-code ${obsolete ? 'obsolete' : ''}`}><span>YOUR ONE-TIME VERIFICATION CODE</span><b>{selected.code}</b><small>{obsolete ? 'Superseded — use the latest invitation.' : invitation?.consumedAt ? 'Code already used. Your verified session may still be active.' : `Expires ${dateLabel(new Date(selected.expiresAt!).toISOString(), true)}`}</small></div>{!obsolete && <Link className="button button-primary email-review-link" to={`/verify/${selected.invitationId}`} onClick={closeInbox}>Open approval page <Icon name="external" size={16}/></Link>}<p className="small muted">This code is for the assigned reviewer and this milestone only. In this frontend demo, codes and emails are stored in your browser.</p></>}{selected.type === 'decision' && <Link className="button button-primary" to="/admin/approvals" onClick={closeInbox}>View updated approvals <Icon name="arrow" size={16}/></Link>}</article> : <div className="empty-state"><Icon name="mail" size={36}/><h3>Your demo inbox is empty</h3><p>Assign an approver to prepare the first invitation.</p></div>}</div></Modal>
}
