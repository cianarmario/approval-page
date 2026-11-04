import type { MilestoneApproval } from '../../types/approval'
import { statusLabels } from '../../utils/format'

export default function StatusBadge({ status }: { status: MilestoneApproval['status'] }) {
  return <span className={`status-badge status-${status}`}><i />{statusLabels[status]}</span>
}
