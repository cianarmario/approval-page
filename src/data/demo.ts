import { MILESTONES, type Approver, type ApprovalStatus, type Milestone, type Project, type PortalState } from '../types/approval.ts'

// Fictional records for frontend demonstration. No messages are sent to these addresses.
export const BOGTONG_DEMO_COORDINATES: [number, number] = [13.16075, 123.73167]

/** Correct only the original sample location while preserving saved review records. */
export function migrateDemoProjectLocations(state: PortalState): PortalState {
  const needsCorrection = (project: Project) => project.id === 'LGP-2026-001' &&
    project.coordinates?.[0] === 13.1674 && project.coordinates?.[1] === 123.7273
  if (!state.projects.some(needsCorrection)) return state
  return { ...state, projects: state.projects.map(project => needsCorrection(project)
    ? { ...project, coordinates: [...BOGTONG_DEMO_COORDINATES] }
    : project) }
}

export const approvers: Approver[] = [
  { id: 'engineer-1', name: 'Engr. Miguel Santos', role: 'Project Engineer', email: 'miguel.santos@example.com', initials: 'MS', color: 'blue' },
  { id: 'engineer-2', name: 'Engr. Ana Reyes', role: 'Project Engineer', email: 'ana.reyes@example.com', initials: 'AR', color: 'purple' },
  { id: 'city-engineer', name: 'Engr. Rafael Cruz', role: 'City Engineer', email: 'rafael.cruz@example.com', initials: 'RC', color: 'teal' },
  { id: 'mayor', name: 'Hon. Isabel Mendoza', role: 'Mayor', email: 'mayor@example.com', initials: 'IM', color: 'orange' },
  { id: 'ceo', name: 'Alex Navarro', role: 'CEO', email: 'ceo@example.com', initials: 'AN', color: 'blue' },
  { id: 'president', name: 'Patricia Ramos', role: 'President', email: 'president@example.com', initials: 'PR', color: 'purple' },
]

export function getApprover(id: string) { return approvers.find(person => person.id === id) }
export function currentApproval(project: Project) { return project.milestones.find(item => item.level === project.progress)! }
export function projectStatus(project: Project): ApprovalStatus { return currentApproval(project).status as ApprovalStatus }

const definitions: { id: string; name: string; category: string; barangay: string; coordinates: [number, number]; budget: number; progress: Milestone; status: ApprovalStatus; assigned?: string }[] = [
  { id: 'LGP-2026-001', name: 'Barangay Bogtong Road Concreting', category: 'Road Infrastructure', barangay: 'Bogtong', coordinates: BOGTONG_DEMO_COORDINATES, budget: 12500000, progress: 25, status: 'pending', assigned: 'engineer-1' },
  { id: 'LGP-2026-002', name: 'Taysan Drainage Improvement', category: 'Flood Control', barangay: 'Taysan', coordinates: [13.1151, 123.7178], budget: 8750000, progress: 50, status: 'unassigned' },
  { id: 'LGP-2026-003', name: 'Rawis Multi-purpose Building', category: 'Public Buildings', barangay: 'Rawis', coordinates: [13.1753, 123.7513], budget: 24000000, progress: 75, status: 'pending', assigned: 'city-engineer' },
  { id: 'LGP-2026-004', name: 'Puro Coastal Protection Works', category: 'Flood Control', barangay: 'Puro', coordinates: [13.1178, 123.7592], budget: 35000000, progress: 25, status: 'changes-requested', assigned: 'engineer-2' },
  { id: 'LGP-2026-005', name: 'Dap-dap Community Health Center', category: 'Public Buildings', barangay: 'Dap-dap', coordinates: [13.1304, 123.7531], budget: 18200000, progress: 100, status: 'unassigned' },
  { id: 'LGP-2026-006', name: 'Gogon Street Lighting Project', category: 'Utilities', barangay: 'Gogon', coordinates: [13.1581, 123.7368], budget: 4200000, progress: 100, status: 'approved', assigned: 'mayor' },
]

export function makeDemoState(): PortalState {
  const today = new Date()
  const day = (offset: number) => new Date(today.getTime() - offset * 86400000).toISOString()
  const projects: Project[] = definitions.map((item, index) => ({
    ...item,
    address: `Barangay ${item.barangay}, Legazpi City, Albay`,
    contractor: ['Bicol Infrastructure Builders', 'Albay Construction Co.', 'Legazpi Development Builders'][index % 3],
    engineer: index % 2 ? 'Engr. Ana Reyes' : 'Engr. Miguel Santos',
    submittedAt: day(index + 1),
    startDate: '2026-07-06',
    targetDate: '2027-03-31',
    description: `${item.name} supports safer, more accessible public infrastructure for the residents of Barangay ${item.barangay}. The project includes site preparation, structural works, quality assurance, and final inspection under the City Engineering Office.`,
    milestones: MILESTONES.map(level => ({
      level,
      approverId: level === item.progress ? item.assigned ?? '' : level === 100 ? 'mayor' : level === 75 ? 'city-engineer' : 'engineer-1',
      status: level < item.progress ? 'approved' : level === item.progress ? item.status : 'upcoming',
      decidedAt: level < item.progress || (level === item.progress && item.status === 'approved') ? day(index + 3) : undefined,
      remarks: level === item.progress && item.status === 'changes-requested' ? 'Please submit the updated material testing results and correct the drainage alignment before requesting another review.' : undefined,
    })),
    updates: [
      { date: day(index + 1), title: `${item.progress}% milestone submitted for review`, detail: 'The project engineer submitted the progress report and inspection summary for milestone review.' },
      { date: day(index + 5), title: 'Site inspection completed', detail: 'Site conditions, completed works, and quantities were reviewed by the project engineering team.' },
      { date: '2026-07-06T08:00:00.000Z', title: 'Project implementation started', detail: 'Site preparation and contractor mobilization commenced.' },
    ],
  }))
  const invitations = projects.filter(p => projectStatus(p) === 'pending').map(p => ({
    id: crypto.randomUUID(), projectId: p.id, approverId: currentApproval(p).approverId, milestone: p.progress,
    code: String(crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000), expiresAt: Date.now() + 600000, attempts: 0,
  }))
  return {
    version: 1, projects, invitations,
    emails: invitations.map(inv => ({ id: crypto.randomUUID(), to: getApprover(inv.approverId)!.email, subject: `Action required: ${inv.milestone}% milestone approval`, message: 'You have been assigned to review a project milestone. Use the verification code below to access the project approval page.', projectId: inv.projectId, invitationId: inv.id, code: inv.code, expiresAt: inv.expiresAt, createdAt: new Date().toISOString(), type: 'invitation' })),
    activity: [
      { id: 'seed-1', projectId: 'LGP-2026-001', title: 'Approval invitation prepared', detail: 'Engr. Miguel Santos was assigned to the 25% milestone.', createdAt: day(0), type: 'assigned' },
      { id: 'seed-2', projectId: 'LGP-2026-004', title: 'Changes requested', detail: 'Engr. Ana Reyes returned the 25% milestone with remarks.', createdAt: day(1), type: 'changes-requested' },
      { id: 'seed-3', projectId: 'LGP-2026-006', title: 'Final milestone approved', detail: 'The 100% milestone was approved by the assigned Mayor.', createdAt: day(2), type: 'approved' },
    ],
  }
}
