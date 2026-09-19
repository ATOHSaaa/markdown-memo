import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import type { Context } from 'hono'

export const SESSION_COOKIE = 'memo_session'
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60
const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000

const encoder = new TextEncoder()

export async function createSessionToken(secret: string): Promise<string> {
  const payload = JSON.stringify({ exp: Date.now() + SESSION_TTL_MS })
  const data = base64UrlEncode(payload)
  const signature = await hmacSign(secret, data)
  return `${data}.${signature}`
}

export async function verifySessionToken(
  secret: string,
  token: string,
): Promise<boolean> {
  const separator = token.lastIndexOf('.')
  if (separator <= 0) return false
  const data = token.slice(0, separator)
  const signature = token.slice(separator + 1)
  if (!(await hmacVerify(secret, data, signature))) return false
  try {
    const payload = JSON.parse(base64UrlDecode(data)) as { exp?: unknown }
    return typeof payload.exp === 'number' && payload.exp > Date.now()
  } catch {
    return false
  }
}

export function readSessionCookie(c: Context): string | undefined {
  return getCookie(c, SESSION_COOKIE)
}

export function writeSessionCookie(c: Context, token: string): void {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === 'https:',
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export function clearSessionCookie(c: Context): void {
  deleteCookie(c, SESSION_COOKIE, { path: '/' })
}

export function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = encoder.encode(a)
  const bBytes = encoder.encode(b)
  const length = Math.max(aBytes.length, bBytes.length)
  let mismatch = aBytes.length === bBytes.length ? 0 : 1
  for (let i = 0; i < length; i += 1) {
    mismatch |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0)
  }
  return mismatch === 0
}

async function hmacSign(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return bufferToBase64Url(signature)
}

async function hmacVerify(
  secret: string,
  data: string,
  signature: string,
): Promise<boolean> {
  const expected = await hmacSign(secret, data)
  return timingSafeEqual(expected, signature)
}

function base64UrlEncode(value: string): string {
  const bytes = encoder.encode(value)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function base64UrlDecode(value: string): string {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/')
  const pad =
    padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  const binary = atob(padded + pad)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}
