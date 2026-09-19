import { useEffect, useMemo, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { fetchMe } from '../lib/api.ts'
import { AuthContext, type AuthStatus } from '../lib/auth.tsx'

export function AuthGate() {
  const location = useLocation()
  const [status, setStatus] = useState<AuthStatus>('loading')
  const value = useMemo(
    () => ({
      status,
      setStatus,
      setAuthed: (authed: boolean) => setStatus(authed ? 'in' : 'out'),
    }),
    [status],
  )

  useEffect(() => {
    let cancelled = false
    void fetchMe().then((ok) => {
      if (!cancelled) setStatus(ok ? 'in' : 'out')
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (status === 'loading') {
    return (
      <div className="grid h-full place-items-center bg-paper text-muted">
        <p className="text-sm tracking-wide">読み込み中…</p>
      </div>
    )
  }

  const onLogin = location.pathname === '/login'
  if (status === 'in' && onLogin) {
    return <Navigate to="/" replace />
  }
  if (status === 'out' && !onLogin) {
    return <Navigate to="/login" replace />
  }

  return (
    <AuthContext.Provider value={value}>
      <Outlet />
    </AuthContext.Provider>
  )
}
