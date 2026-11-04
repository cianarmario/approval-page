export const MILESTONES = [25, 50, 75, 100] as const
export type Milestone = (typeof MILESTONES)[number]
export type ApprovalStatus = 'unassigned' | 'pending' | 'approved' | 'changes-requested'
export type OfficialRole = 'Project Engineer' | 'City Engineer' | 'Mayor' | 'CEO' | 'President'

export interface Approver {
  id: string
  name: string
  role: OfficialRole
  email: string
  initials: string
  color: string
}

export interface MilestoneApproval {
  level: Milestone
  approverId: string
  status: ApprovalStatus | 'upcoming'
  decidedAt?: string
  remarks?: string
}

export interface ProjectImage {
  url: string
  alt: string
  caption?: string
  capturedAt?: string
  capturedBy?: string
}

export interface Project {
  id: string
  name: string
  category: string
  barangay: string
  address: string
  coordinates: [number, number]
  budget: number
  contractor: string
  engineer: string
  progress: Milestone
  submittedAt: string
  startDate: string
  targetDate: string
  description: string
  images?: ProjectImage[]
  milestones: MilestoneApproval[]
  updates: { date: string; title: string; detail: string }[]
}

export interface Invitation {
  id: string
  projectId: string
  approverId: string
  milestone: Milestone
  code: string
  expiresAt: number
  consumedAt?: number
  cancelled?: boolean
  attempts: number
}

export interface DemoEmail {
  id: string
  to: string
  subject: string
  message: string
  projectId: string
  invitationId?: string
  code?: string
  expiresAt?: number
  createdAt: string
  type: 'invitation' | 'decision'
}

export interface Activity {
  id: string
  projectId: string
  title: string
  detail: string
  createdAt: string
  type: 'assigned' | 'approved' | 'changes-requested' | 'resent'
}

export interface PortalState {
  version: 1
  projects: Project[]
  invitations: Invitation[]
  emails: DemoEmail[]
  activity: Activity[]
}
