import { formatRelativeTime } from '../lib/time.ts'
import { cn } from '../lib/cn.ts'
import type { NoteSummary } from '../lib/types.ts'
import { CloseIcon, LogoutIcon, PlusIcon, SearchIcon, TrashIcon } from './Icons.tsx'

type SidebarProps = {
  open: boolean
  isDesktop: boolean
  notes: NoteSummary[]
  selectedId?: string
  query: string
  onQueryChange: (value: string) => void
  onSelect: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
  onLogout: () => void
  onClose: () => void
}

export function Sidebar({
  open,
  isDesktop,
  notes,
  selectedId,
  query,
  onQueryChange,
  onSelect,
  onCreate,
  onDelete,
  onLogout,
  onClose,
}: SidebarProps) {
  return (
    <>
      {!isDesktop && open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ink/35"
          aria-label="メニューを閉じる"
          onClick={onClose}
        />
      ) : null}
      <aside
        className={cn(
          'z-50 flex w-[min(20rem,88vw)] shrink-0 flex-col border-r border-border bg-sidebar',
          isDesktop
            ? 'relative h-full'
            : 'fixed inset-y-0 left-0 transition-transform duration-200 ease-out',
          !isDesktop && !open && '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div>
            <p className="text-[11px] font-medium tracking-[0.2em] text-accent">
              MEMO
            </p>
            <h1 className="text-lg font-semibold text-ink">メモ</h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onCreate}
              className="grid h-10 w-10 place-items-center rounded-xl text-ink hover:bg-paper"
              aria-label="新規メモ"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
            {!isDesktop ? (
              <button
                type="button"
                onClick={onClose}
                className="grid h-10 w-10 place-items-center rounded-xl text-ink hover:bg-paper"
                aria-label="閉じる"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        </div>

        <label className="relative mx-3 mb-3 block">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="メモを検索"
            className="h-11 w-full rounded-xl border border-border bg-paper pl-9 pr-3 text-base text-ink outline-none ring-accent/30 placeholder:text-muted focus:ring-2"
          />
        </label>

        <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {notes.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted">
              {query ? '一致するメモはありません' : 'まだメモがありません'}
            </p>
          ) : (
            <ul className="space-y-1">
              {notes.map((note) => {
                const selected = note.id === selectedId
                return (
                  <li key={note.id}>
                    <div
                      className={cn(
                        'group flex items-stretch rounded-xl',
                        selected ? 'bg-paper' : 'hover:bg-paper/70',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => onSelect(note.id)}
                        className="min-w-0 flex-1 px-3 py-2.5 text-left"
                      >
                        <span className="block truncate text-sm font-medium text-ink">
                          {note.title || '無題'}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">
                          {formatRelativeTime(note.updated_at)}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="grid w-10 shrink-0 place-items-center text-muted opacity-100 hover:text-accent md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                        aria-label={`${note.title || '無題'}を削除`}
                        onClick={() => onDelete(note.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </nav>

        <div className="border-t border-border px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
          <button
            type="button"
            onClick={onLogout}
            className="flex h-11 w-full items-center gap-2 rounded-xl px-3 text-sm text-muted hover:bg-paper hover:text-ink"
          >
            <LogoutIcon className="h-4 w-4" />
            ログアウト
          </button>
        </div>
      </aside>
    </>
  )
}
