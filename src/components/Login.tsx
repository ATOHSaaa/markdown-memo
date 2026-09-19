import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, login } from '../lib/api.ts'
import { useAuth } from '../lib/auth.tsx'

export function Login() {
  const navigate = useNavigate()
  const { setAuthed } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await login(password)
      setAuthed(true)
      navigate('/', { replace: true })
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        setError('パスワードが違います')
      } else {
        setError('ログインできませんでした')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid h-full place-items-center bg-paper px-5">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl border border-border bg-panel p-6 shadow-sm"
      >
        <p className="text-xs font-medium tracking-[0.2em] text-accent">MEMO</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">メモ</h1>
        <p className="mt-2 text-sm text-muted">
          パスワードを入力して、自分のメモを開きます。
        </p>
        <label className="mt-6 block text-sm text-muted" htmlFor="password">
          パスワード
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 h-11 w-full rounded-xl border border-border bg-paper px-3 text-base text-ink outline-none ring-accent/30 focus:ring-2"
          required
        />
        {error ? (
          <p className="mt-3 text-sm text-accent" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="mt-5 h-11 w-full rounded-xl bg-ink text-sm font-medium text-paper disabled:opacity-60"
        >
          {submitting ? '確認中…' : '入る'}
        </button>
      </form>
    </div>
  )
}
