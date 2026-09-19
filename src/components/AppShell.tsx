import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AuthError,
  createNote,
  deleteNote,
  getNote,
  listNotes,
  logout,
} from '../lib/api.ts'
import { useIsDesktop } from '../lib/useIsDesktop.ts'
import type { Note, NoteSummary } from '../lib/types.ts'
import { useAuth } from '../lib/auth.tsx'
import { MenuIcon, PlusIcon } from './Icons.tsx'
import { Sidebar } from './Sidebar.tsx'

const EditorPane = lazy(async () => {
  const module = await import('./Editor.tsx')
  return { default: module.EditorPane }
})

export function AppShell() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { setAuthed } = useAuth()
  const isDesktop = useIsDesktop()
  const [notes, setNotes] = useState<NoteSummary[]>([])
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [note, setNote] = useState<Note | null>(null)
  const [listError, setListError] = useState('')
  const [loadError, setLoadError] = useState<{ id: string; message: string } | null>(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(true)
  const sidebarOpen = isDesktop || (!id ? true : mobileSidebarOpen)
  const noteError = loadError && loadError.id === id ? loadError.message : ''
  const activeNote = id && note?.id === id ? note : null
  const loadingNote = Boolean(id) && !noteError && !activeNote

  const handleAuthError = useCallback(() => {
    setAuthed(false)
    navigate('/login', { replace: true })
  }, [navigate, setAuthed])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    let cancelled = false
    void listNotes(debouncedQuery)
      .then((items) => {
        if (cancelled) return
        setNotes(items)
        setListError('')
      })
      .catch((error) => {
        if (cancelled) return
        if (error instanceof AuthError) {
          handleAuthError()
          return
        }
        setListError('一覧を読み込めませんでした')
      })
    return () => {
      cancelled = true
    }
  }, [debouncedQuery, handleAuthError])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    void getNote(id)
      .then((item) => {
        if (cancelled) return
        setNote(item)
        setLoadError(null)
      })
      .catch((error) => {
        if (cancelled) return
        if (error instanceof AuthError) {
          handleAuthError()
          return
        }
        setLoadError({ id, message: 'メモが見つかりません' })
      })
    return () => {
      cancelled = true
    }
  }, [id, handleAuthError])

  async function handleCreate() {
    try {
      const created = await createNote()
      setNotes((current) => [
        {
          id: created.id,
          title: created.title,
          updated_at: created.updated_at,
        },
        ...current.filter((item) => item.id !== created.id),
      ])
      setMobileSidebarOpen(false)
      navigate(`/n/${created.id}`)
    } catch (error) {
      if (error instanceof AuthError) handleAuthError()
    }
  }

  async function handleDelete(noteId: string) {
    if (!window.confirm('このメモを削除しますか？')) return
    try {
      await deleteNote(noteId)
      setNotes((current) => current.filter((item) => item.id !== noteId))
      if (id === noteId) {
        navigate('/')
      }
    } catch (error) {
      if (error instanceof AuthError) handleAuthError()
    }
  }

  async function handleLogout() {
    try {
      await logout()
    } finally {
      setAuthed(false)
      navigate('/login', { replace: true })
    }
  }

  function handleSaved(update: Pick<Note, 'id' | 'title' | 'updated_at'>) {
    setNotes((current) =>
      [...current.map((item) => (item.id === update.id ? { ...item, ...update } : item))].sort(
        (a, b) => b.updated_at - a.updated_at,
      ),
    )
    setNote((current) =>
      current && current.id === update.id ? { ...current, ...update } : current,
    )
  }

  function handleTitleChange(title: string) {
    if (!id) return
    setNotes((current) =>
      current.map((item) => (item.id === id ? { ...item, title } : item)),
    )
  }

  return (
    <div className="flex h-full bg-paper text-ink">
      <Sidebar
        open={sidebarOpen}
        isDesktop={isDesktop}
        notes={notes}
        selectedId={id}
        query={query}
        onQueryChange={setQuery}
        onSelect={(noteId) => {
          setMobileSidebarOpen(false)
          navigate(`/n/${noteId}`)
        }}
        onCreate={() => void handleCreate()}
        onDelete={(noteId) => void handleDelete(noteId)}
        onLogout={() => void handleLogout()}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-border px-2 py-1.5 md:hidden pt-[max(0.4rem,env(safe-area-inset-top))]">
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-xl hover:bg-sidebar"
            aria-label="メモ一覧を開く"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <p className="min-w-0 flex-1 truncate text-sm font-medium">
            {activeNote?.title || 'メモ'}
          </p>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-xl hover:bg-sidebar"
            aria-label="新規メモ"
            onClick={() => void handleCreate()}
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </header>

        {listError ? (
          <p className="border-b border-border px-4 py-2 text-sm text-accent">{listError}</p>
        ) : null}

        {loadingNote ? (
          <div className="grid flex-1 place-items-center text-sm text-muted">読み込み中…</div>
        ) : noteError ? (
          <div className="grid flex-1 place-items-center px-6 text-center text-sm text-muted">
            {noteError}
          </div>
        ) : activeNote ? (
          <Suspense
            fallback={
              <div className="grid flex-1 place-items-center text-sm text-muted">
                エディタを読み込み中…
              </div>
            }
          >
            <EditorPane
              key={activeNote.id}
              note={activeNote}
              onSaved={handleSaved}
              onTitleChange={handleTitleChange}
              onAuthError={handleAuthError}
            />
          </Suspense>
        ) : (
          <div className="grid flex-1 place-items-center px-6 text-center">
            <div>
              <p className="text-lg font-medium">メモを開きましょう</p>
              <p className="mt-2 text-sm text-muted">
                左の一覧から選ぶか、新しいメモを作成してください。
              </p>
              <button
                type="button"
                onClick={() => void handleCreate()}
                className="mt-5 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper"
              >
                新規メモ
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
