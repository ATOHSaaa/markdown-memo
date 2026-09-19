import { createContext, useContext, type Dispatch, type SetStateAction } from 'react'

export type AuthStatus = 'loading' | 'in' | 'out'

type AuthContextValue = {
  status: AuthStatus
  setStatus: Dispatch<SetStateAction<AuthStatus>>
  setAuthed: (value: boolean) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used within AuthGate')
  }
  return value
}
