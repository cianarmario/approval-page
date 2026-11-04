import { getApprover } from '../../data/demo'
import type { Project } from '../../types/approval'
import { dateLabel, statusLabels } from '../../utils/format'

export default function ApprovalMilestones({ project }: { project: Project }) {
  return <section className="approval-section" id="project-progress" aria-labelledby="progress-heading">
    <div className="approval-section-heading"><h2 id="progress-heading">Milestone approvals</h2><span>4 review stages</span></div>
    <div className="approval-milestone-table-wrap"><table className="approval-milestone-table"><caption>Approval status at each project milestone</caption><thead><tr><th scope="col">Milestone</th><th scope="col">Assigned approver</th><th scope="col">Status</th></tr></thead><tbody>{project.milestones.map(milestone => {
      const person = getApprover(milestone.approverId)
      return <tr key={milestone.level} className={milestone.level === project.progress ? 'is-current' : ''}><th scope="row">{milestone.level}%<span>{milestone.level === 100 ? 'Final approval' : milestone.level === project.progress ? 'Current review' : 'Progress review'}</span></th><td>{person?.name ?? 'Not yet assigned'}<small>{person?.role ?? 'Awaiting assignment'}</small></td><td><span className={`approval-table-status status-${milestone.status}`}>{statusLabels[milestone.status]}</span>{milestone.decidedAt && <time dateTime={milestone.decidedAt}>{dateLabel(milestone.decidedAt)}</time>}</td></tr>
    })}</tbody></table></div>
    <ol className="approval-mobile-milestones" aria-label="Approval status at each project milestone">{project.milestones.map(milestone => {
      const person = getApprover(milestone.approverId)
      return <li key={milestone.level} className={milestone.level === project.progress ? 'is-current' : ''} aria-current={milestone.level === project.progress ? 'step' : undefined}>
        <div className="approval-mobile-milestone-heading"><strong>{milestone.level}% <span>{milestone.level === 100 ? 'Final approval' : 'milestone'}</span></strong><span className={`approval-table-status status-${milestone.status}`}>{statusLabels[milestone.status]}</span></div>
        {milestone.level === project.progress && <p className="approval-mobile-current-label">Current review stage</p>}
        <dl><div><dt>Assigned approver</dt><dd>{person?.name ?? 'Not yet assigned'}<small>{person?.role ?? 'Awaiting assignment'}</small></dd></div>{milestone.decidedAt && <div><dt>Decision date</dt><dd><time dateTime={milestone.decidedAt}>{dateLabel(milestone.decidedAt)}</time></dd></div>}</dl>
      </li>
    })}</ol>
    <p className="approval-progress-note">Milestone approval authorizes the next stage. Physical progress is updated separately by the project engineer.</p>
  </section>
}
