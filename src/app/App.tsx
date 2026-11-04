import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PortalProvider } from './PortalContext'
import OtpPage from '../pages/OtpPage'

const ReviewPage = lazy(() => import('../pages/ReviewPage'))
const ApprovalPreviewPage = lazy(() => import('../pages/ApprovalPreviewPage'))
const ConfirmationPage = lazy(() => import('../pages/ConfirmationPage'))
const ProjectPage = lazy(() => import('../pages/ProjectPage'))
const PublicProjectsPage = lazy(() => import('../pages/PublicProjectsPage'))

export default function App() {
  return <BrowserRouter><PortalProvider><Suspense fallback={<main className="page-width" style={{ paddingBlock: 48 }}><p>Loading project review...</p></main>}><Routes>
    <Route path="/" element={<OtpPage />} />
    <Route path="/verify/:invitationId" element={<OtpPage />} />
    <Route path="/review/:invitationId" element={<ReviewPage />} />
    <Route path="/approval-preview" element={<ApprovalPreviewPage />} />
    <Route path="/confirmation/:invitationId" element={<ConfirmationPage />} />
    <Route path="/projects/:projectId" element={<ProjectPage />} />
    <Route path="/public" element={<PublicProjectsPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense></PortalProvider></BrowserRouter>
}
