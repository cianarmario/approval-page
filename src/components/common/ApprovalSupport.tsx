import { useState } from 'react'
import { approvalSupport } from '../../config/portal'
import Icon from '../ui/Icon'
import '../../styles/support.css'

export default function ApprovalSupport({ projectId }: { projectId?: string }) {
  const [copyNotice, setCopyNotice] = useState('')
  const subject = `Project approval assistance${projectId ? ` - ${projectId}` : ''}`

  async function copyReference() {
    if (!projectId) return
    try {
      await navigator.clipboard.writeText(projectId)
      setCopyNotice('Project reference copied.')
    } catch {
      setCopyNotice(`Project reference: ${projectId}`)
    }
  }

  return <aside className="approval-support" aria-label="Project approval support">
    <strong>Need help with your invitation?</strong>
    <p>Contact the project administrator and include your project reference. Keep your verification code private.</p>
    <a href={`mailto:${approvalSupport.email}?subject=${encodeURIComponent(subject)}`}><Icon name="mail" size={15} />{approvalSupport.email}</a>
    {projectId && <div className="approval-support-reference"><span>{projectId}</span><button type="button" onClick={copyReference}>Copy reference</button></div>}
    {approvalSupport.isSample && <small>Sample administrator contact for this frontend preview.</small>}
    <span className="approval-support-notice" role="status">{copyNotice}</span>
  </aside>
}
