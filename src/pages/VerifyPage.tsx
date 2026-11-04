import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { usePortal } from '../app/PortalContext'
import PublicHeader from '../components/common/PublicHeader'
import Icon from '../components/ui/Icon'
import { currentApproval, getApprover } from '../data/demo'
import { activeInvitation } from '../services/approvalWorkflow'
import logo from '../assets/images/city-engineering-logo.png'

export default function VerifyPage() {
  const { invitationId = '' } = useParams()
  const { state, verify, resend, isVerified, openInbox } = usePortal()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())
  const [cooldown, setCooldown] = useState(0)
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer) }, [])
  const invitation = activeInvitation(state, invitationId)
  const project = state.projects.find(p => p.id === invitation?.projectId)
  const person = getApprover(invitation?.approverId ?? '')
  if (!invitation || !project || !person) return <><PublicHeader/><div className="centered-state"><span className="large-state-icon"><Icon name="lock" size={30}/></span><h1>This invitation is unavailable</h1><p>It may have been replaced by a newer invitation. Open the latest message or contact the project administrator.</p><button className="button button-primary" onClick={openInbox}>Open demo inbox</button><Link className="text-button" to="/admin/approvals">Return to admin workspace</Link></div></>
  if (currentApproval(project).status !== 'pending') return <Navigate to={`/confirmation/${invitationId}`} replace/>
  if (isVerified(invitationId)) return <Navigate to={`/review/${invitationId}`} replace/>
  const expired = now >= invitation.expiresAt
  const remaining = Math.max(0, Math.ceil((invitation.expiresAt - now) / 1000))
  function submit(event: FormEvent) {
    event.preventDefault()
    const issue = verify(invitationId, code)
    if (issue) setError(issue)
    else navigate(`/review/${invitationId}`)
  }
  return <div className="verification-page"><PublicHeader/><main className="verification-main"><div className="verification-intro"><div className="eyebrow"><Icon name="shield" size={16}/>MILESTONE APPROVAL PORTAL</div><h1>One code.<br/>A clear path forward.</h1><p>Your review helps ensure every milestone meets the standards our city deserves.</p><div className="verify-project-summary"><span className="project-icon"><Icon name="building" size={24}/></span><div><small>{project.id}</small><h2>{project.name}</h2><p><Icon name="location" size={14}/>{project.address}</p></div></div><div className="verify-assigned"><span className={`avatar avatar-${person.color}`}>{person.initials}</span><div><small>ASSIGNED REVIEWER</small><b>{person.name}</b><p>{person.role} · {invitation.milestone}% milestone</p></div></div><div className="verify-trust"><Icon name="lock" size={16}/><span>No account or password required.</span></div></div><section className="verification-card"><img src={logo} alt="City Engineering Office"/><span className="verification-icon"><Icon name="mail" size={25}/></span><h2>Verify your access</h2><p>Enter the 6-digit code from your invitation email.</p><b className="verification-email">{person.email}</b><form onSubmit={submit}><label htmlFor="verification-code">Verification code</label><input id="verification-code" className="otp-input" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="000000" value={code} onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }} aria-describedby="otp-help" required/><div id="otp-help" className={`code-expiry ${expired ? 'expired' : ''}`}><Icon name="clock" size={14}/>{expired ? 'Your code has expired. Request a new one below.' : `Code expires in ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`}</div>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary verify-submit" type="submit" disabled={code.length !== 6 || expired}>Verify & view project <Icon name="arrow" size={17}/></button></form><div className="resend-row"><span>Didn’t receive a code?</span><button className="text-button" disabled={now < cooldown} onClick={() => { try { resend(invitationId); setError(''); setCode(''); setCooldown(Date.now() + 30000) } catch (issue) { setError((issue as Error).message) } }}>{now < cooldown ? `Resend in ${Math.ceil((cooldown - now) / 1000)}s` : 'Resend code'}</button></div><div className="demo-inbox-callout"><Icon name="info" size={17}/><p>Testing the frontend? Find your code in the <button className="inline-link" onClick={openInbox}>demo inbox</button>.</p></div></section></main><footer className="public-footer">City Engineering Office · Legazpi City, Albay <span>Frontend preview · No real email delivery</span></footer></div>
}
