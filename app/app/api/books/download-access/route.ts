import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabasePublicConfig } from '../../../../lib/supabaseConfig'
import { createBookDownloadToken } from '../../../../lib/bookDownloadToken'

const RAW_BOOK_TABLES = [
  process.env.BOOKS_TABLE,
  process.env.BOOKS_TABLE_FALLBACK,
  'books',
  'public.books',
]

const BOOK_TABLES = RAW_BOOK_TABLES
  .flatMap((value) => {
    const trimmed = String(value || '').trim().replace(/"/g, '')
    if (!trimmed) return []
    const dotted = trimmed.replace(/\s+/g, '.')
    if (!dotted.includes('.')) return [dotted]
    const parts = dotted.split('.').filter(Boolean)
    return [dotted, parts[parts.length - 1]]
  })
  .filter((value, index, arr) => arr.indexOf(value) === index)

type ErrorWithMessage = { message?: string }
type DbBookRow = {
  id: string
  is_published: boolean
  online_purchase_enabled: boolean
  download_url: string | null
}

type DownloadAccessPayload = {
  bookId?: string
  paymentMethod?: 'mobile_money' | 'visa'
  paymentReference?: string
}

type QueryResult<T> = PromiseLike<{ data: T | null; error: ErrorWithMessage | null }>

function createSupabaseClient(config: { supabaseUrl: string; supabaseAnonKey: string }) {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function isMissingTableError(error: unknown) {
  const msg = String((error as ErrorWithMessage | null)?.message || '').toLowerCase()
  return msg.includes('could not find the table') || (msg.includes('relation') && msg.includes('does not exist'))
}

async function runWithBooksTableFallback<T>(
  operation: (table: string) => QueryResult<T>
): Promise<{ data?: T | null; error: ErrorWithMessage | null }> {
  let lastResult: { data: T | null; error: ErrorWithMessage | null } | null = null

  for (const table of BOOK_TABLES) {
    const result = await operation(table)
    if (!result.error) return result
    lastResult = result
    if (!isMissingTableError(result.error)) return result
  }

  return lastResult?.error
    ? { ...lastResult, error: { ...lastResult.error, message: `Books table is not available. Tried: ${BOOK_TABLES.join(', ')}` } }
    : { data: undefined, error: { message: 'No books tables configured' } }
}

async function verifyPayment(payload: { bookId: string; paymentReference: string; paymentMethod: 'mobile_money' | 'visa' }) {
  const verificationUrl = (process.env.BOOK_PAYMENT_VERIFICATION_URL || '').trim()
  if (!verificationUrl) {
    return { success: false as const, message: 'Payment verification is not configured yet. Please contact support.' }
  }

  const verificationToken = (process.env.BOOK_PAYMENT_VERIFICATION_TOKEN || '').trim()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (verificationToken) headers['x-verification-token'] = verificationToken

  try {
    const response = await fetch(verificationUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      cache: 'no-store',
    })

    const data = await response.json().catch(() => ({})) as { paid?: boolean; status?: string; message?: string }
    if (!response.ok) {
      return { success: false as const, message: data.message || 'Payment verification failed.' }
    }

    if (data.paid === true || String(data.status || '').toLowerCase() === 'paid') {
      return { success: true as const }
    }

    return { success: false as const, message: data.message || 'Payment has not been confirmed yet.' }
  } catch {
    return { success: false as const, message: 'Unable to verify payment right now. Please try again shortly.' }
  }
}

export async function POST(req: NextRequest) {
  const config = getSupabasePublicConfig()
  if (!config) return NextResponse.json({ error: 'Missing Supabase URL or anon key' }, { status: 500 })

  const body = (await req.json()) as DownloadAccessPayload
  const bookId = typeof body.bookId === 'string' ? body.bookId.trim() : ''
  const paymentReference = typeof body.paymentReference === 'string' ? body.paymentReference.trim() : ''
  const paymentMethod = body.paymentMethod === 'visa' ? 'visa' : body.paymentMethod === 'mobile_money' ? 'mobile_money' : null

  if (!bookId || !paymentReference || !paymentMethod) {
    return NextResponse.json({ error: 'Book, payment method, and payment reference are required.' }, { status: 400 })
  }

  const supabase = createSupabaseClient(config)
  const { data, error } = await runWithBooksTableFallback((table) =>
    supabase
      .from(table)
      .select('id, is_published, online_purchase_enabled, download_url')
      .eq('id', bookId)
      .maybeSingle()
  )

  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json({ error: 'Books are unavailable right now.' }, { status: 503 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) return NextResponse.json({ error: 'Book not found.' }, { status: 404 })

  const book = data as DbBookRow
  if (!book.is_published || !book.online_purchase_enabled) {
    return NextResponse.json({ error: 'This book is not available for digital purchase.' }, { status: 400 })
  }
  if (!book.download_url) {
    return NextResponse.json({ error: 'Download file is not configured yet for this book.' }, { status: 400 })
  }

  const verification = await verifyPayment({ bookId, paymentReference, paymentMethod })
  if (!verification.success) {
    return NextResponse.json({ error: verification.message }, { status: 402 })
  }

  const token = createBookDownloadToken(bookId)
  if (!token) {
    return NextResponse.json({ error: 'Download token secret is not configured. Please contact support.' }, { status: 503 })
  }

  return NextResponse.json({ downloadUrl: `/api/books/download-file?token=${encodeURIComponent(token)}` })
}
