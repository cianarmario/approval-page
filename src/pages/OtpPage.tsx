import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { usePortal } from '../app/PortalContext'
import Icon from '../components/ui/Icon'
import PortalHeader from '../components/common/PortalHeader'
import PortalFooter from '../components/common/PortalFooter'
import ApprovalSupport from '../components/common/ApprovalSupport'
import Modal from '../components/ui/Modal'
import officePhoto from '../assets/images/engineering-office.jpg'
import { currentApproval, getApprover } from '../data/demo'
import { activeInvitation } from '../services/approvalWorkflow'
import { MAX_ATTEMPTS, RESEND_COOLDOWN } from '../services/otpPreview'

const emptyDigits = () => Array<string>(6).fill('')

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function maskEmail(email: string) {
  const [name, domain] = email.split('@')
  return `${name.slice(0, 1)}*****${name.includes('.') ? name.slice(name.indexOf('.')) : ''}@${domain}`
}

export default function OtpPage() {
  const { invitationId } = useParams()
  const { state, verify, resend, isVerified } = usePortal()
  const navigate = useNavigate()
  const defaultInvitation = [...state.invitations].reverse().find(item => item.projectId === 'LGP-2026-001' && !item.cancelled)
  const challenge = activeInvitation(state, invitationId ?? defaultInvitation?.id ?? '')
  const project = state.projects.find(item => item.id === challenge?.projectId)
  const reviewer = getApprover(challenge?.approverId ?? '')
  const verified = challenge ? isVerified(challenge.id) : false
  const [digits, setDigits] = useState(emptyDigits)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [now, setNow] = useState(Date.now())
  const [cooldown, setCooldown] = useState(0)
  const digitRefs = useRef<(HTMLInputElement | null)[]>([])
  const [helpOpen, setHelpOpen] = useState(false)

  const secondsLeft = challenge ? Math.max(0, Math.ceil((challenge.expiresAt - now) / 1000)) : 0
  const resendSeconds = Math.max(0, Math.ceil((cooldown - now) / 1000))
  const expired = Boolean(challenge && now >= challenge.expiresAt)
  const locked = Boolean(challenge && challenge.attempts >= MAX_ATTEMPTS)
  const pending = project ? currentApproval(project).status === 'pending' : false
  const codeEnabled = Boolean(challenge && pending && !expired && !locked && !verified)

  useEffect(() => { document.title = 'Verify Approval Access | Legazpi Project Monitoring' }, [])
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    if (!verified) digitRefs.current[0]?.focus({ preventScroll: true })
  }, [challenge?.code, verified])
  useEffect(() => {
    if (verified && challenge) navigate(`/review/${challenge.id}`, { replace: true })
  }, [verified, challenge?.id, navigate])

  function resendCode() {
    const timestamp = Date.now()
    if (!challenge || verified || !pending || timestamp < cooldown) return
    try {
      resend(challenge.id)
      setDigits(emptyDigits())
      setError('')
      setNotice('A new preview code is ready for the assigned approver. The previous code is no longer valid.')
      setCooldown(timestamp + RESEND_COOLDOWN)
      setNow(timestamp)
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'A new code could not be prepared. Please try again.')
    }
  }

  function updateDigits(index: number, value: string) {
    const incoming = value.replace(/\D/g, '').slice(0, 6 - index)
    setDigits(previous => {
      const next = [...previous]
      if (!incoming) next[index] = ''
      else incoming.split('').forEach((digit, offset) => { next[index + offset] = digit })
      return next
    })
    setError('')
    if (incoming) digitRefs.current[Math.min(index + incoming.length, 5)]?.focus()
  }

  function pasteCode(event: ClipboardEvent<HTMLInputElement>, index: number) {
    event.preventDefault()
    updateDigits(index, event.clipboardData.getData('text'))
  }

  function navigateDigits(event: KeyboardEvent<HTMLInputElement>, index: number) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      digitRefs.current[Math.max(0, Math.min(5, index + (event.key === 'ArrowLeft' ? -1 : 1)))]?.focus()
    } else if (event.key === 'Backspace' && !digits[index] && index > 0) {
      event.preventDefault()
      setDigits(previous => previous.map((digit, position) => position === index - 1 ? '' : digit))
      setError('')
      digitRefs.current[index - 1]?.focus()
    }
  }

  function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!challenge || verified) return
    const issue = verify(challenge.id, digits.join(''))
    setNow(Date.now())
    setError(issue ?? '')
    setNotice('')
    if (issue) digitRefs.current[0]?.focus()
  }

  if (!challenge || !project || !reviewer) return <div className="otp-page"><PortalHeader /><main className="page-width invitation-unavailable"><h1>This invitation is unavailable</h1><p>Open the latest invitation email or contact the project administrator for access.</p><Link to="/">Return to verification</Link><ApprovalSupport /></main><PortalFooter /></div>

  return (
    <div className="otp-page">
      <a className="skip-link" href="#verification">Skip to verification</a>
      <PortalHeader onHelp={() => setHelpOpen(true)} />
      <main className="otp-main page-width">
        <div className="page-context"><span>Project approvals</span><span aria-hidden="true">/</span><span>Access verification</span></div>
        <div className="verification-shell">
          <aside className="monitoring-panel" aria-labelledby="monitoring-heading">
            <img className="monitoring-background" src={officePhoto} alt="" aria-hidden="true" />
            <div className="monitoring-shade" aria-hidden="true" />
            <div className="monitoring-content">
              <p className="section-label">APPROVAL REQUEST</p>
              <span className="project-reference">{project.id}</span>
              <h2 id="monitoring-heading">{project.name}</h2>
              <p className="project-location"><Icon name="location" size={15} />{project.address}</p>
              <section className="milestone-summary" aria-labelledby="milestone-heading">
                <div className="milestone-heading"><h3 id="milestone-heading">Current milestone</h3><strong>{project.progress}%</strong></div>
                <ol className="milestone-stages" aria-label="Project approval milestones">
                  {[25, 50, 75, 100].map(milestone => <li key={milestone} className={milestone === project.progress ? 'is-active' : ''} aria-current={milestone === project.progress ? 'step' : undefined}><span>{milestone}%</span></li>)}
                </ol>
                <p>{pending ? 'Pending milestone review' : 'Milestone decision recorded'}</p>
              </section>
              <dl className="reviewer-details"><div><dt>Assigned approver</dt><dd>{reviewer.name}</dd></div><div><dt>Designation</dt><dd>{reviewer.role}</dd></div></dl>
              <div className="office-details"><span>City Engineering Office</span><span>Legazpi City, Albay</span></div>
            </div>
          </aside>

          <section className="verification-panel" id="verification" aria-labelledby="verification-heading">
            <div className="form-heading"><h1 id="verification-heading">Verify your access</h1></div>
            <p className="form-description">Enter the 6-digit code included in your project approval invitation. No account or password is required.</p>
            <div className="invitation-recipient"><span>Invitation email</span><strong>{maskEmail(reviewer.email)}</strong></div>
            {!pending && <p className="form-error" role="status">This milestone already has a recorded decision. Contact the project administrator if you need further access.</p>}
            <form className="code-form" onSubmit={verifyCode}>
              <fieldset disabled={!codeEnabled} aria-describedby="code-hint verification-error">
                <legend>6-digit verification code</legend>
                <div className="digit-inputs">
                  {digits.map((digit, index) => <input key={index} ref={element => { digitRefs.current[index] = element }} type="text" inputMode="numeric" autoComplete={index === 0 ? 'one-time-code' : 'off'} pattern="[0-9]*" maxLength={6} aria-label={`Digit ${index + 1} of 6`} aria-invalid={Boolean(error)} value={digit} onChange={event => updateDigits(index, event.target.value)} onPaste={event => pasteCode(event, index)} onKeyDown={event => navigateDigits(event, index)} onFocus={event => event.target.select()} />)}
                </div>
              </fieldset>
              <div id="code-hint" className={`code-timer${expired || locked ? ' is-expired' : ''}`}><Icon name={verified ? 'checkCircle' : 'clock'} size={14} />{verified ? 'Opening project approval...' : expired ? 'Your code has expired. Select Resend Code below.' : locked ? 'Attempt limit reached. Select Resend Code below.' : <>Code expires in <strong>{formatTime(secondsLeft)}</strong></>}</div>
              <p className="form-error" id="verification-error" role="alert">{error}</p>
              <button className={`primary-button${verified ? ' is-verified' : ''}`} type="submit" disabled={!codeEnabled || digits.some(digit => !digit)}>{verified ? <>Access verified <Icon name="checkCircle" size={17} /></> : <>Verify & continue <Icon name="arrow" size={17} /></>}</button>
            </form>
            <div className="resend-row"><span>Need a new verification code?</span><button className="text-button resend-button" type="button" disabled={!pending || verified || resendSeconds > 0} onClick={resendCode}>{resendSeconds > 0 ? `Resend Code in ${resendSeconds}s` : 'Resend Code'}</button></div>
            <div className="request-notice" role="status">{notice}</div>
            <div className="verification-assurance"><Icon name="lock" size={15} /><p>For the assigned approver only. Do not share your code.</p></div>
            <p className="invitation-help">Cannot access your invitation? <button type="button" className="invitation-support-button" onClick={() => setHelpOpen(true)}>Contact the administrator</button></p>
            <details className="preview-details"><summary><span className="preview-tag">PREVIEW</span> Sample invitation &middot; View test code</summary><div className="preview-code"><span>No email is sent in this frontend preview.<small>Use this code to try the verification form.</small></span><code>{challenge.code}</code></div><p>Enter the code to open this project's approval page.</p><Link to="/approval-preview">Preview project approval page <Icon name="arrow" size={13} /></Link></details>
          </section>
        </div>
      </main>
      <PortalFooter />
      {helpOpen && <Modal className="otp-help-modal" title="Help with your invitation" onClose={() => setHelpOpen(false)}><div className="otp-help-modal-body">
        <p>Your project administrator assigns the approver for each milestone. Open the link in your approval invitation and enter its six-digit code.</p>
        <ul><li>No account registration or password is required.</li><li>If your code expires, select <strong>Resend Code</strong>. A replacement is intended for the same assigned approver.</li><li>A new code invalidates the previous one and is valid for 10 minutes.</li><li>If you are not the intended approver or cannot access the email, contact the project administrator.</li></ul>
        <div className="help-preview-note">This frontend uses sample records. Expand <strong>View test code</strong> to try OTP verification and the project review. No real email is sent.</div>
        <ApprovalSupport projectId={project.id} />
        <button className="primary-button" type="button" onClick={() => setHelpOpen(false)}>Got it <Icon name="check" size={16} /></button>
      </div></Modal>}
    </div>
  )
}
