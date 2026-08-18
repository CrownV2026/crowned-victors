import { createHmac, timingSafeEqual } from 'crypto'

type DownloadTokenPayload = {
  bookId: string
  exp: number
}

function toBase64Url(value: Buffer | string) {
  return Buffer.from(value).toString('base64url')
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url')
}

function getSecret() {
  return (process.env.BOOK_DOWNLOAD_TOKEN_SECRET || '').trim()
}

function signPayload(payloadPart: string, secret: string) {
  return toBase64Url(createHmac('sha256', secret).update(payloadPart).digest())
}

export function createBookDownloadToken(bookId: string, ttlSeconds = 900) {
  const secret = getSecret()
  if (!secret) return null

  const payload: DownloadTokenPayload = {
    bookId,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  }
  const payloadPart = toBase64Url(JSON.stringify(payload))
  const signature = signPayload(payloadPart, secret)
  return `${payloadPart}.${signature}`
}

export function verifyBookDownloadToken(token: string) {
  const secret = getSecret()
  if (!secret) return { payload: null, error: 'Download token secret is not configured.' as const }

  const [payloadPart, signaturePart] = token.split('.')
  if (!payloadPart || !signaturePart) {
    return { payload: null, error: 'Invalid token format.' as const }
  }

  const expectedSignature = signPayload(payloadPart, secret)
  const actual = Buffer.from(signaturePart)
  const expected = Buffer.from(expectedSignature)
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return { payload: null, error: 'Invalid token signature.' as const }
  }

  try {
    const payload = JSON.parse(fromBase64Url(payloadPart).toString('utf8')) as DownloadTokenPayload
    if (!payload.bookId || !Number.isFinite(payload.exp)) {
      return { payload: null, error: 'Invalid token payload.' as const }
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return { payload: null, error: 'Token has expired.' as const }
    }
    return { payload, error: null }
  } catch {
    return { payload: null, error: 'Invalid token payload.' as const }
  }
}
