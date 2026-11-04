import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { makeDemoState, migrateDemoProjectLocations } from '../data/demo'
import { assignApprovers, recordDecision, resendCode, SESSION_LIFETIME, verifyCode, type Assignments } from '../services/approvalWorkflow'
import type { PortalState } from '../types/approval'

const STORAGE_KEY = 'legazpi-approval-demo-v1'
function loadState(): PortalState {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (saved?.version === 1 && Array.isArray(saved.projects) && Array.isArray(saved.invitations) && Array.isArray(saved.emails) && Array.isArray(saved.activity)) return migrateDemoProjectLocations(saved)
  } catch { /* Start a fresh demo when browser storage is unavailable or invalid. */ }
  return makeDemoState()
}

interface PortalContextValue {
  state: PortalState
  storageWarning: boolean
  assign: (projectId: string, assignments: Assignments) => void
  resend: (id: string) => void
  verify: (id: string, code: string) => string | undefined
  isVerified: (id: string) => boolean
  decide: (id: string, approve: boolean, remarks: string) => void
  reset: () => void
  toast: string
  notify: (message: string) => void
  inboxOpen: boolean
  openInbox: () => void
  closeInbox: () => void
}

const PortalContext = createContext<PortalContextValue | null>(null)

export function PortalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(loadState)
  const [storageWarning, setStorageWarning] = useState(false)
  const [sessions, setSessions] = useState<Record<string, number>>(() => {
    try { return JSON.parse(sessionStorage.getItem('legazpi-demo-sessions') ?? '{}') } catch { return {} }
  })
  const [toast, setToast] = useState('')
  const [inboxOpen, setInboxOpen] = useState(false)
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { setStorageWarning(true) }
  }, [state])
  useEffect(() => {
    try { sessionStorage.setItem('legazpi-demo-sessions', JSON.stringify(sessions)) } catch { /* In-memory sessions still work. */ }
  }, [sessions])
  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(''), 5000)
    return () => clearTimeout(timeout)
  }, [toast])

  const isVerified = (id: string) => Boolean(sessions[id] && sessions[id] > Date.now() && state.invitations.find(item => item.id === id && !item.cancelled)?.consumedAt)
  const value: PortalContextValue = {
    state, storageWarning, toast, notify: setToast, isVerified, inboxOpen, openInbox: () => setInboxOpen(true), closeInbox: () => setInboxOpen(false),
    assign(projectId, assignments) { setState(assignApprovers(state, projectId, assignments)); setToast('Approvers saved. A demo invitation is ready in the inbox.') },
    resend(id) {
      setState(resendCode(state, id))
      setSessions(previous => { const next = { ...previous }; delete next[id]; return next })
      setToast('A new verification code is ready in the demo inbox.')
    },
    verify(id, code) {
      const result = verifyCode(state, id, code)
      setState(result.state)
      if (!result.error) setSessions(previous => ({ ...previous, [id]: Date.now() + SESSION_LIFETIME }))
      return result.error
    },
    decide(id, approve, remarks) { setState(recordDecision(state, id, approve, remarks, isVerified(id))) },
    reset() { setState(makeDemoState()); setSessions({}); setToast('Demo workspace reset.') },
  }
  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>
}

export function usePortal() {
  const value = useContext(PortalContext)
  if (!value) throw new Error('PortalProvider is required.')
  return value
}
