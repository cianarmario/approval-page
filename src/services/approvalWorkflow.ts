import { currentApproval, getApprover } from '../data/demo.ts'
import { MILESTONES, type Invitation, type Milestone, type PortalState } from '../types/approval.ts'

export const OTP_LIFETIME = 10 * 60 * 1000
export const SESSION_LIFETIME = 30 * 60 * 1000
export const FINAL_ROLES = ['Mayor', 'CEO', 'President']
export type Assignments = Record<Milestone, string>

function newInvitation(projectId: string, approverId: string, milestone: Milestone): Invitation {
  return { id: crypto.randomUUID(), projectId, approverId, milestone, code: String(crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000), expiresAt: Date.now() + OTP_LIFETIME, attempts: 0 }
}

export function activeInvitation(state: PortalState, invitationId: string) {
  const invitation = state.invitations.find(item => item.id === invitationId)
  const project = state.projects.find(item => item.id === invitation?.projectId)
  if (!invitation || invitation.cancelled || !project || project.progress !== invitation.milestone || currentApproval(project).approverId !== invitation.approverId) return undefined
  return invitation
}

export function assignApprovers(state: PortalState, projectId: string, assignments: Assignments): PortalState {
  const project = state.projects.find(item => item.id === projectId)
  if (!project) throw new Error('This project could not be found.')
  for (const level of MILESTONES) {
    const person = getApprover(assignments[level])
    if (!person) throw new Error(`Select an approver for the ${level}% milestone.`)
    if (level === 100 && !FINAL_ROLES.includes(person.role)) throw new Error('The final approver must be a Mayor, CEO, or President.')
    const existing = project.milestones.find(item => item.level === level)!
    if (existing.status === 'approved' && existing.approverId !== person.id) throw new Error('An approved milestone cannot be reassigned.')
  }
  const needsReview = currentApproval(project).status !== 'approved'
  const invitation = needsReview ? newInvitation(project.id, assignments[project.progress], project.progress) : undefined
  const now = new Date().toISOString()
  return {
    ...state,
    projects: state.projects.map(item => item.id !== projectId ? item : { ...item, submittedAt: needsReview ? now : item.submittedAt, milestones: item.milestones.map(m => ({ ...m, approverId: assignments[m.level], status: m.level === item.progress && needsReview ? 'pending' : m.status, remarks: m.level === item.progress && needsReview ? undefined : m.remarks })) }),
    invitations: [...state.invitations.map(item => needsReview && item.projectId === projectId && item.milestone === project.progress ? { ...item, cancelled: true } : item), ...(invitation ? [invitation] : [])],
    emails: invitation ? [{ id: crypto.randomUUID(), to: getApprover(invitation.approverId)!.email, subject: `Action required: ${project.progress}% milestone approval`, message: 'You have been assigned to review this project milestone. Review the project details and use your one-time code to access the approval page.', projectId, invitationId: invitation.id, code: invitation.code, expiresAt: invitation.expiresAt, createdAt: now, type: 'invitation' }, ...state.emails] : state.emails,
    activity: [{ id: crypto.randomUUID(), projectId, title: needsReview ? 'Approvers assigned · invitation prepared' : 'Future approvers updated', detail: needsReview ? `${getApprover(assignments[project.progress])!.name} was assigned to review the ${project.progress}% milestone.` : 'The future milestone assignments were saved.', createdAt: now, type: 'assigned' }, ...state.activity],
  }
}

export function resendCode(state: PortalState, invitationId: string): PortalState {
  const invitation = activeInvitation(state, invitationId)
  if (!invitation) throw new Error('This invitation is no longer active. Ask the administrator for a new invitation.')
  const project = state.projects.find(item => item.id === invitation.projectId)!
  if (currentApproval(project).status !== 'pending') throw new Error('This milestone has already received a decision.')
  const now = new Date().toISOString()
  const replacement = newInvitation(invitation.projectId, invitation.approverId, invitation.milestone)
  if (replacement.code === invitation.code) replacement.code = String((Number(replacement.code) - 100000 + 1) % 900000 + 100000)
  return {
    ...state,
    invitations: state.invitations.map(item => item.id === invitationId ? { ...replacement, id: invitationId } : item),
    emails: [{ id: crypto.randomUUID(), to: getApprover(invitation.approverId)!.email, subject: 'Your new project approval verification code', message: 'A new verification code was requested. The previous code is no longer valid. Your new code expires in 10 minutes.', projectId: invitation.projectId, invitationId, code: replacement.code, expiresAt: replacement.expiresAt, createdAt: now, type: 'invitation' }, ...state.emails],
    activity: [{ id: crypto.randomUUID(), projectId: invitation.projectId, title: 'Verification code resent', detail: `A new demo code was prepared for ${getApprover(invitation.approverId)!.name}.`, createdAt: now, type: 'resent' }, ...state.activity],
  }
}

export function verifyCode(state: PortalState, invitationId: string, code: string): { state: PortalState; error?: string } {
  const invitation = activeInvitation(state, invitationId)
  if (!invitation) return { state, error: 'This invitation is no longer active. Contact the project administrator.' }
  const project = state.projects.find(item => item.id === invitation.projectId)!
  if (currentApproval(project).status !== 'pending') return { state, error: 'This milestone has already received a decision.' }
  if (invitation.consumedAt) return { state, error: 'This code has already been used. Request a new code to continue.' }
  if (Date.now() >= invitation.expiresAt) return { state, error: 'Your verification code has expired. Select Resend code to request a new one.' }
  if (invitation.attempts >= 5) return { state, error: 'Too many incorrect attempts. Request a new code to try again.' }
  if (!/^\d{6}$/.test(code) || code !== invitation.code) return { state: { ...state, invitations: state.invitations.map(item => item.id === invitationId ? { ...item, attempts: item.attempts + 1 } : item) }, error: 'That code is incorrect. Check the latest demo email and try again.' }
  return { state: { ...state, invitations: state.invitations.map(item => item.id === invitationId ? { ...item, consumedAt: Date.now() } : item) } }
}

export function recordDecision(state: PortalState, invitationId: string, approve: boolean, remarks: string, verified: boolean): PortalState {
  const invitation = activeInvitation(state, invitationId)
  if (!invitation || !verified || !invitation.consumedAt) throw new Error('Please verify your access before submitting a decision.')
  const project = state.projects.find(item => item.id === invitation.projectId)!
  if (currentApproval(project).status !== 'pending') throw new Error('This milestone has already received a decision.')
  if (!approve && remarks.trim().length < 10) throw new Error('Please provide at least 10 characters explaining the requested changes.')
  const now = new Date().toISOString()
  const person = getApprover(invitation.approverId)!
  const status = approve ? 'approved' : 'changes-requested'
  const title = approve ? `${invitation.milestone}% milestone approved` : 'Changes requested'
  return {
    ...state,
    projects: state.projects.map(item => item.id !== project.id ? item : { ...item, milestones: item.milestones.map(m => m.level === invitation.milestone ? { ...m, status, decidedAt: now, remarks: remarks.trim() } : m) }),
    emails: [{ id: crypto.randomUUID(), to: `admin@example.com; ${getApprover('engineer-1')!.email}; ${getApprover('engineer-2')!.email}`, subject: `${title} · ${project.name}`, message: `${person.name} ${approve ? 'approved' : 'requested changes to'} the ${invitation.milestone}% milestone.${remarks.trim() ? ` Remarks: ${remarks.trim()}` : ''}`, projectId: project.id, createdAt: now, type: 'decision' }, ...state.emails],
    activity: [{ id: crypto.randomUUID(), projectId: project.id, title, detail: `${person.name} ${approve ? 'approved this milestone.' : `requested changes: ${remarks.trim()}`}`, createdAt: now, type: status }, ...state.activity],
  }
}
