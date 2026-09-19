import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { extractTitle } from '../../shared/title.ts'
import { AuthError, updateNote, uploadImage } from '../lib/api.ts'
import { cn } from '../lib/cn.ts'
import { htmlToMarkdown, markdownToHtml } from '../lib/markdown.ts'
import type { Note, SaveState } from '../lib/types.ts'
import {
  BoldIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  OrderedListIcon,
  QuoteIcon,
} from './Icons.tsx'

const SAVE_DELAY_MS = 1000
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
])

type EditorPaneProps = {
  note: Note
  onSaved: (note: Pick<Note, 'id' | 'title' | 'updated_at'>) => void
  onTitleChange: (title: string) => void
  onAuthError: () => void
}

export function EditorPane({
  note,
  onSaved,
  onTitleChange,
  onAuthError,
}: EditorPaneProps) {
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingRef = useRef<string | null>(null)
  const timerRef = useRef<number | null>(null)
  const editorInstanceRef = useRef<Editor | null>(null)
  const callbacksRef = useRef({ onSaved, onTitleChange, onAuthError, noteId: note.id })
  const flushSaveRef = useRef<() => Promise<void>>(async () => {})

  useEffect(() => {
    callbacksRef.current = { onSaved, onTitleChange, onAuthError, noteId: note.id }
  }, [onSaved, onTitleChange, onAuthError, note.id])

  async function flushSave() {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    const content = pendingRef.current
    if (content == null) return
    pendingRef.current = null
    setSaveState('saving')
    try {
      const updated = await updateNote(callbacksRef.current.noteId, content)
      callbacksRef.current.onSaved(updated)
      if (pendingRef.current == null) {
        setSaveState('saved')
      }
    } catch (error) {
      pendingRef.current = content
      if (error instanceof AuthError) {
        callbacksRef.current.onAuthError()
        return
      }
      setSaveState('error')
    }
  }

  useEffect(() => {
    flushSaveRef.current = flushSave
  })

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({ allowBase64: false }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Placeholder.configure({
        placeholder: '書き始めましょう',
      }),
    ],
    content: markdownToHtml(note.content),
    editorProps: {
      attributes: {
        class: 'tiptap',
      },
      handlePaste: (_view, event) => {
        const files = imageFilesFrom(event.clipboardData)
        if (files.length === 0) return false
        event.preventDefault()
        void insertImages(files)
        return true
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false
        const files = imageFilesFrom(event.dataTransfer)
        if (files.length === 0) return false
        event.preventDefault()
        const position = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        })?.pos
        void insertImages(files, position)
        return true
      },
    },
    onCreate: ({ editor: current }) => {
      editorInstanceRef.current = current
    },
    onUpdate: ({ editor: current }) => {
      const markdown = htmlToMarkdown(current.getHTML())
      pendingRef.current = markdown
      setSaveState('unsaved')
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => {
        void flushSaveRef.current()
      }, SAVE_DELAY_MS)
      callbacksRef.current.onTitleChange(extractTitle(markdown))
    },
  })

  useEffect(() => {
    editorInstanceRef.current = editor
  }, [editor])

  async function insertImages(files: File[], position?: number) {
    const current = editorInstanceRef.current
    if (!current || files.length === 0) return
    setUploadError('')
    setUploading(true)
    try {
      for (const file of files) {
        const url = await uploadImage(callbacksRef.current.noteId, file)
        const chain = current.chain().focus()
        if (position != null) {
          chain.setTextSelection(position)
        }
        chain.setImage({ src: url }).run()
      }
    } catch (error) {
      if (error instanceof AuthError) {
        callbacksRef.current.onAuthError()
        return
      }
      setUploadError('画像をアップロードできませんでした')
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') {
        void flushSaveRef.current()
      }
    }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onHide)
      void flushSaveRef.current()
    }
  }, [])

  function setLink() {
    if (!editor) return
    const previous = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('リンク URL', previous ?? 'https://')
    if (url === null) return
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-panel">
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border px-2 py-1.5">
        <ToolbarButton
          label="見出し1"
          active={editor?.isActive('heading', { level: 1 }) ?? false}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1Icon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="見出し2"
          active={editor?.isActive('heading', { level: 2 }) ?? false}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2Icon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="太字"
          active={editor?.isActive('bold') ?? false}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <BoldIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="斜体"
          active={editor?.isActive('italic') ?? false}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <ItalicIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="箇条書き"
          active={editor?.isActive('bulletList') ?? false}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <ListIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="番号付きリスト"
          active={editor?.isActive('orderedList') ?? false}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <OrderedListIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="引用"
          active={editor?.isActive('blockquote') ?? false}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          <QuoteIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="コード"
          active={editor?.isActive('code') ?? false}
          onClick={() => editor?.chain().focus().toggleCode().run()}
        >
          <CodeIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="リンク"
          active={editor?.isActive('link') ?? false}
          onClick={setLink}
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="画像"
          active={false}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={(event) => {
            const files = [...(event.target.files ?? [])].filter((file) =>
              ALLOWED_IMAGE_TYPES.has(file.type),
            )
            event.target.value = ''
            void insertImages(files)
          }}
        />
        <p className="ml-auto shrink-0 px-2 text-xs text-muted">
          {uploading
            ? '画像をアップロード中…'
            : uploadError
              ? uploadError
              : saveLabel(saveState)}
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

function saveLabel(state: SaveState): string {
  if (state === 'saving') return '保存中…'
  if (state === 'unsaved') return '未保存'
  if (state === 'error') return '保存に失敗しました'
  return '保存済み'
}

function imageFilesFrom(data: DataTransfer | null): File[] {
  if (!data) return []
  return [...data.files].filter((file) => ALLOWED_IMAGE_TYPES.has(file.type))
}

function ToolbarButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'grid h-10 w-10 shrink-0 place-items-center rounded-lg text-ink',
        active ? 'bg-code' : 'hover:bg-code/70',
      )}
    >
      {children}
    </button>
  )
}
