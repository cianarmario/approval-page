import { currentApproval, getApprover } from '../data/demo'
import type { Project } from '../types/approval'
import { statusLabels } from './format'

export function exportApprovals(projects: Project[]) {
  const rows = [['Project ID', 'Project name', 'Barangay', 'Progress', 'Approval status', 'Approver', 'Remarks'], ...projects.map(p => { const approval = currentApproval(p); return [p.id, p.name, p.barangay, `${p.progress}%`, statusLabels[approval.status], getApprover(approval.approverId)?.name ?? 'Not assigned', approval.remarks ?? ''] })]
  const csv = rows.map(row => row.map(value => `"${String(value).replace(/^[=+@-]/, "'$&").replace(/"/g, '""')}"`).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'legazpi-approval-report.csv'
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
