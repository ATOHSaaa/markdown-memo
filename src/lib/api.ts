import type { Note, NoteSummary } from './types.ts'

export class AuthError extends Error {
  constructor() {
    super('unauthorized')
    this.name = 'AuthError'
  }
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init)
  if (res.status === 401) {
    throw new AuthError()
  }
  if (!res.ok) {
    throw new ApiError(res.status, await res.text())
  }
  return (await res.json()) as T
}

export async function fetchMe(): Promise<boolean> {
  const res = await fetch('/api/me')
  return res.ok
}

export async function login(password: string): Promise<void> {
  await request('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
}

export async function logout(): Promise<void> {
  await request('/api/logout', { method: 'POST' })
}

export async function listNotes(query = ''): Promise<NoteSummary[]> {
  const params = new URLSearchParams()
  if (query.trim()) {
    params.set('q', query.trim())
  }
  const suffix = params.size ? `?${params}` : ''
  const data = await request<{ notes: NoteSummary[] }>(`/api/notes${suffix}`)
  return data.notes
}

export async function createNote(): Promise<Note> {
  return request<Note>('/api/notes', { method: 'POST' })
}

export async function getNote(id: string): Promise<Note> {
  return request<Note>(`/api/notes/${id}`)
}

export async function updateNote(
  id: string,
  content: string,
): Promise<Pick<Note, 'id' | 'title' | 'updated_at'>> {
  return request(`/api/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
}

export async function deleteNote(id: string): Promise<void> {
  await request(`/api/notes/${id}`, { method: 'DELETE' })
}

export async function uploadImage(noteId: string, file: File): Promise<string> {
  const body = new FormData()
  body.append('noteId', noteId)
  body.append('file', file)
  const data = await request<{ url: string }>('/api/images', {
    method: 'POST',
    body,
  })
  return data.url
}
