export type NoteSummary = {
  id: string
  title: string
  updated_at: number
}

export type Note = NoteSummary & {
  content: string
  created_at: number
}

export type SaveState = 'saved' | 'saving' | 'unsaved' | 'error'
