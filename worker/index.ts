import { Hono } from 'hono'
import { extractTitle } from '../shared/title.ts'
import {
  clearSessionCookie,
  createSessionToken,
  readSessionCookie,
  timingSafeEqual,
  verifySessionToken,
  writeSessionCookie,
} from './auth.ts'

type AppEnv = {
  Bindings: Env
}

type NoteRow = {
  id: string
  title: string
  content: string
  created_at: number
  updated_at: number
}

const MAX_MARKDOWN_CHARS = 1_000_000
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
}

const app = new Hono<AppEnv>()

app.use('/api/*', async (c, next) => {
  if (c.req.path === '/api/login') {
    return next()
  }
  if (!c.env.AUTH_SECRET) {
    return c.json({ error: 'unauthorized' }, 401)
  }
  const token = readSessionCookie(c)
  if (!token || !(await verifySessionToken(c.env.AUTH_SECRET, token))) {
    return c.json({ error: 'unauthorized' }, 401)
  }
  return next()
})

app.post('/api/login', async (c) => {
  if (!c.env.AUTH_PASSWORD || !c.env.AUTH_SECRET) {
    return c.json({ error: 'server_misconfigured' }, 500)
  }
  let password: unknown
  try {
    const body = await c.req.json<{ password?: unknown }>()
    password = body.password
  } catch {
    return c.json({ error: 'invalid' }, 400)
  }
  if (typeof password !== 'string' || !timingSafeEqual(password, c.env.AUTH_PASSWORD)) {
    return c.json({ error: 'invalid_password' }, 401)
  }
  const token = await createSessionToken(c.env.AUTH_SECRET)
  writeSessionCookie(c, token)
  return c.json({ ok: true })
})

app.post('/api/logout', (c) => {
  clearSessionCookie(c)
  return c.json({ ok: true })
})

app.get('/api/me', (c) => c.json({ ok: true }))

app.get('/api/notes', async (c) => {
  const query = c.req.query('q')?.trim() ?? ''
  if (query) {
    const pattern = likePattern(query)
    const result = await c.env.DB.prepare(
      `SELECT id, title, updated_at FROM notes
       WHERE title LIKE ? ESCAPE '\\' OR content LIKE ? ESCAPE '\\'
       ORDER BY updated_at DESC`,
    )
      .bind(pattern, pattern)
      .all<{ id: string; title: string; updated_at: number }>()
    return c.json({ notes: result.results })
  }
  const result = await c.env.DB.prepare(
    `SELECT id, title, updated_at FROM notes ORDER BY updated_at DESC`,
  ).all<{ id: string; title: string; updated_at: number }>()
  return c.json({ notes: result.results })
})

app.post('/api/notes', async (c) => {
  const id = crypto.randomUUID()
  const now = Date.now()
  await c.env.DB.prepare(
    `INSERT INTO notes (id, title, content, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(id, '無題', '', now, now)
    .run()
  const note: NoteRow = {
    id,
    title: '無題',
    content: '',
    created_at: now,
    updated_at: now,
  }
  return c.json(note, 201)
})

app.get('/api/notes/:id', async (c) => {
  const note = await c.env.DB.prepare(`SELECT * FROM notes WHERE id = ?`)
    .bind(c.req.param('id'))
    .first<NoteRow>()
  if (!note) {
    return c.json({ error: 'not_found' }, 404)
  }
  return c.json(note)
})

app.put('/api/notes/:id', async (c) => {
  let content: unknown
  try {
    const body = await c.req.json<{ content?: unknown }>()
    content = body.content
  } catch {
    return c.json({ error: 'invalid' }, 400)
  }
  if (typeof content !== 'string') {
    return c.json({ error: 'invalid' }, 400)
  }
  if (content.length > MAX_MARKDOWN_CHARS) {
    return c.json({ error: 'too_large' }, 413)
  }
  const id = c.req.param('id')
  const title = extractTitle(content)
  const now = Date.now()
  const result = await c.env.DB.prepare(
    `UPDATE notes SET title = ?, content = ?, updated_at = ? WHERE id = ?`,
  )
    .bind(title, content, now, id)
    .run()
  if (!result.meta.changes) {
    return c.json({ error: 'not_found' }, 404)
  }
  return c.json({ id, title, updated_at: now })
})

app.delete('/api/notes/:id', async (c) => {
  const id = c.req.param('id')
  const existing = await c.env.DB.prepare(`SELECT id FROM notes WHERE id = ?`)
    .bind(id)
    .first<{ id: string }>()
  if (!existing) {
    return c.json({ error: 'not_found' }, 404)
  }
  await deletePrefix(c.env.IMAGES, `images/${id}/`)
  await c.env.DB.prepare(`DELETE FROM notes WHERE id = ?`).bind(id).run()
  return c.json({ ok: true })
})

app.post('/api/images', async (c) => {
  const form = await c.req.formData()
  const noteId = String(form.get('noteId') ?? '')
  const file = form.get('file')
  if (!noteId || !(file instanceof File)) {
    return c.json({ error: 'invalid' }, 400)
  }
  const extension = IMAGE_EXTENSIONS[file.type]
  if (!extension) {
    return c.json({ error: 'unsupported_type' }, 415)
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return c.json({ error: 'too_large' }, 413)
  }
  const note = await c.env.DB.prepare(`SELECT id FROM notes WHERE id = ?`)
    .bind(noteId)
    .first<{ id: string }>()
  if (!note) {
    return c.json({ error: 'not_found' }, 404)
  }
  const filename = `${crypto.randomUUID()}.${extension}`
  const key = `images/${noteId}/${filename}`
  await c.env.IMAGES.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  })
  return c.json({ url: `/api/images/${noteId}/${filename}` }, 201)
})

app.get('/api/images/:noteId/:filename', async (c) => {
  const key = `images/${c.req.param('noteId')}/${c.req.param('filename')}`
  const object = await c.env.IMAGES.get(key)
  if (!object) {
    return c.json({ error: 'not_found' }, 404)
  }
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('Cache-Control', 'private, max-age=31536000, immutable')
  return new Response(object.body, { headers })
})

app.all('/api/*', (c) => c.json({ error: 'not_found' }, 404))

export default app

function likePattern(query: string): string {
  return `%${query.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')}%`
}

async function deletePrefix(bucket: R2Bucket, prefix: string): Promise<void> {
  let cursor: string | undefined
  do {
    const listed = await bucket.list({ prefix, cursor })
    await Promise.all(listed.objects.map((object) => bucket.delete(object.key)))
    cursor = listed.truncated ? listed.cursor : undefined
  } while (cursor)
}
