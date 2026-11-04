import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { usePortal } from '../app/PortalContext'
import { getApprover } from '../data/demo'
import { activeInvitation } from '../services/approvalWorkflow'
import ApprovalProjectView from '../features/approvals/ApprovalProjectView'

export default function ReviewPage() {
  const { invitationId = '' } = useParams()
  const navigate = useNavigate()
  const { state, isVerified, decide, storageWarning } = usePortal()
  const [, setTick] = useState(0)
  const invitation = activeInvitation(state, invitationId)
  const project = state.projects.find(item => item.id === invitation?.projectId)
  const reviewer = getApprover(invitation?.approverId ?? '')
  useEffect(() => {
    const timer = window.setInterval(() => setTick(value => value + 1), 10000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => { if (project) document.title = `${project.name} | Milestone approval` }, [project?.name])
  if (!invitation || !project || !reviewer || !isVerified(invitationId)) return <Navigate to={`/verify/${encodeURIComponent(invitationId)}`} replace />
  return <ApprovalProjectView project={project} reviewer={reviewer} storageWarning={storageWarning} notification={state.emails.find(item => item.projectId === project.id && item.type === 'decision')} onDecision={(approved, remarks) => { decide(invitationId, approved, remarks); navigate(`/confirmation/${encodeURIComponent(invitationId)}`) }} />
}
