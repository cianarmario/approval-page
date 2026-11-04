import { useEffect, useState } from 'react'
import ApprovalProjectView from '../features/approvals/ApprovalProjectView'
import { useNavigate } from 'react-router-dom'
import { getApprover, makeDemoState } from '../data/demo'
import { recordDecision, verifyCode } from '../services/approvalWorkflow'

export default function ApprovalPreviewPage() {
  const navigate = useNavigate()
  const [state, setState] = useState(() => {
    const sample = makeDemoState()
    const invitation = sample.invitations[0]
    return verifyCode(sample, invitation.id, invitation.code).state
  })
  const invitation = state.invitations[0]
  const project = state.projects.find(item => item.id === invitation.projectId)!
  const reviewer = getApprover(invitation.approverId)!
  useEffect(() => { document.title = `${project.name} | Approval preview` }, [project.name])
  return <ApprovalProjectView project={project} reviewer={reviewer} preview notification={state.emails.find(item => item.projectId === project.id && item.type === 'decision')} onDecision={(approved, remarks) => {
    const next = recordDecision(state, invitation.id, approved, remarks, true)
    setState(next)
    navigate(`/confirmation/${invitation.id}`, { state: { previewProject: next.projects.find(item => item.id === project.id) } })
  }} />
}
