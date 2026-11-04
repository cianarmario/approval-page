import { useEffect } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { usePortal } from '../app/PortalContext'
import { currentApproval, getApprover } from '../data/demo'
import ApprovalProjectView from '../features/approvals/ApprovalProjectView'
import PortalHeader from '../components/common/PortalHeader'
import PortalFooter from '../components/common/PortalFooter'
import type { Project } from '../types/approval'

export default function ProjectPage() {
  const { projectId } = useParams()
  const location = useLocation()
  const { state } = usePortal()
  const previewProject = (location.state as { previewProject?: Project } | null)?.previewProject
  const project = previewProject?.id === projectId ? previewProject : state.projects.find(item => item.id === projectId)
  useEffect(() => {
    document.title = `${project?.name ?? 'Project not found'} | Legazpi Project Monitoring`
    window.scrollTo(0, 0)
  }, [project?.id, project?.name])
  if (!project) return <div className="approval-page"><PortalHeader accessLabel="Public project information" /><main className="page-width invitation-unavailable"><h1>Project not found</h1><p>This project is not available in the frontend registry.</p><Link to="/public">View public projects</Link></main><PortalFooter /></div>
  return <ApprovalProjectView project={project} reviewer={getApprover(currentApproval(project).approverId)} readOnly preview={Boolean(previewProject)} />
}
