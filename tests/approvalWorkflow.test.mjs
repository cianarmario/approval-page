import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeDemoState, currentApproval } from '../src/data/demo.ts'
import { assignApprovers, verifyCode, resendCode, recordDecision, activeInvitation } from '../src/services/approvalWorkflow.ts'

function assignmentsFor(project) {
  return Object.fromEntries(project.milestones.map(m => [m.level, m.approverId || 'engineer-2']))
}

function pending() {
  const state = makeDemoState()
  return { state, invitation: state.invitations[0] }
}

test('assigns the workflow and prepares an email only for the active milestone', () => {
  const state = makeDemoState()
  const project = state.projects.find(p => p.progress === 50)
  const next = assignApprovers(state, project.id, assignmentsFor(project))
  const updated = next.projects.find(p => p.id === project.id)
  assert.equal(currentApproval(updated).status, 'pending')
  assert.equal(updated.milestones[0].status, 'approved')
  assert.equal(updated.milestones[2].status, 'upcoming')
  assert.equal(next.emails.length, state.emails.length + 1)
  assert.equal(next.invitations.at(-1).milestone, 50)
  assert.equal(next.emails[0].code, next.invitations.at(-1).code)
  assert.equal(currentApproval(project).status, 'unassigned', 'original state is not mutated')
})

test('restricts the final signatory and locks completed milestone assignments', () => {
  const state = makeDemoState()
  const project = state.projects.find(p => p.progress === 50)
  assert.throws(() => assignApprovers(state, project.id, { ...assignmentsFor(project), 100: 'engineer-1' }), /Mayor, CEO, or President/)
  assert.throws(() => assignApprovers(state, project.id, { ...assignmentsFor(project), 25: 'engineer-2' }), /cannot be reassigned/)
})

test('reassignment invalidates a previously verified invitation', () => {
  const { state, invitation } = pending()
  const verified = verifyCode(state, invitation.id, invitation.code).state
  const project = verified.projects.find(p => p.id === invitation.projectId)
  const next = assignApprovers(verified, project.id, assignmentsFor(project))
  assert.equal(activeInvitation(next, invitation.id), undefined)
  assert.throws(() => recordDecision(next, invitation.id, true, '', true), /verify your access/)
})

test('an OTP expires and cannot be consumed a second time', () => {
  const { state, invitation } = pending()
  const expired = structuredClone(state)
  expired.invitations[0].expiresAt = Date.now() - 1
  assert.match(verifyCode(expired, invitation.id, invitation.code).error, /expired/)
  const result = verifyCode(state, invitation.id, invitation.code)
  assert.equal(result.error, undefined)
  assert.ok(result.state.invitations[0].consumedAt)
  assert.match(verifyCode(result.state, invitation.id, invitation.code).error, /already been used/)
})

test('five incorrect attempts require a new verification code', () => {
  let { state, invitation } = pending()
  const wrong = invitation.code === '111111' ? '222222' : '111111'
  for (let i = 0; i < 5; i++) state = verifyCode(state, invitation.id, wrong).state
  assert.equal(state.invitations[0].attempts, 5)
  assert.match(verifyCode(state, invitation.id, invitation.code).error, /Too many/)
  const resent = resendCode(state, invitation.id)
  assert.equal(resent.invitations[0].attempts, 0)
  assert.equal(verifyCode(resent, invitation.id, resent.invitations[0].code).error, undefined)
})

test('resend replaces the code while retaining the old email accurately', () => {
  const { state, invitation } = pending()
  const oldEmail = state.emails.find(email => email.invitationId === invitation.id)
  const next = resendCode(state, invitation.id)
  const updated = next.invitations.find(item => item.id === invitation.id)
  assert.notEqual(updated.code, invitation.code)
  assert.match(verifyCode(next, invitation.id, invitation.code).error, /incorrect/)
  assert.equal(next.emails.find(email => email.id === oldEmail.id).code, invitation.code)
  assert.equal(next.emails[0].code, updated.code)
})

test('approval requires verified access, records the decision, and retains physical progress', () => {
  const { state, invitation } = pending()
  assert.throws(() => recordDecision(state, invitation.id, true, '', true), /verify/)
  const verified = verifyCode(state, invitation.id, invitation.code).state
  assert.throws(() => recordDecision(verified, invitation.id, true, '', false), /verify/)
  const next = recordDecision(verified, invitation.id, true, 'Inspection accepted.', true)
  const project = next.projects.find(p => p.id === invitation.projectId)
  assert.equal(currentApproval(project).status, 'approved')
  assert.equal(project.progress, invitation.milestone)
  assert.equal(project.milestones[1].status, 'upcoming')
  assert.equal(currentApproval(project).remarks, 'Inspection accepted.')
  assert.equal(next.emails[0].type, 'decision')
  assert.match(next.emails[0].to, /admin@example.com/)
  assert.throws(() => recordDecision(next, invitation.id, true, '', true), /already received a decision/)
})

test('not approving requires substantive remarks and supports a fresh review request', () => {
  const { state, invitation } = pending()
  const verified = verifyCode(state, invitation.id, invitation.code).state
  assert.throws(() => recordDecision(verified, invitation.id, false, '   ', true), /at least 10 characters/)
  const remarks = 'Please correct the drainage alignment and submit updated testing results.'
  const next = recordDecision(verified, invitation.id, false, remarks, true)
  const project = next.projects.find(p => p.id === invitation.projectId)
  assert.equal(currentApproval(project).status, 'changes-requested')
  assert.equal(currentApproval(project).remarks, remarks)
  assert.match(next.emails[0].message, /drainage alignment/)
  assert.throws(() => resendCode(next, invitation.id), /already received a decision/)
  const requested = assignApprovers(next, project.id, assignmentsFor(project))
  assert.equal(currentApproval(requested.projects.find(p => p.id === project.id)).status, 'pending')
  assert.equal(activeInvitation(requested, invitation.id), undefined)
  assert.equal(next.activity[0].type, 'changes-requested', 'original review history remains intact')
})
