import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabasePublicConfig } from '../../../../lib/supabaseConfig'
import { verifyBookDownloadToken } from '../../../../lib/bookDownloadToken'

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

function inferFilenameFromUrl(url: string) {
  try {
    const parsed = new URL(url)
    const segments = parsed.pathname.split('/').filter(Boolean)
    const raw = segments[segments.length - 1] || 'book-download'
    return raw.replace(/[\r\n"]/g, '_')
  } catch {
    return 'book-download'
  }
}

function isTrustedDownloadUrl(url: string, supabaseUrl: string) {
  try {
    const download = new URL(url)
    const supabase = new URL(supabaseUrl)
    return download.protocol === 'https:' && download.hostname === supabase.hostname
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || ''
  if (!token) return NextResponse.json({ error: 'Missing download token.' }, { status: 400 })

  const { payload, error: tokenError } = verifyBookDownloadToken(token)
  if (!payload) {
    return NextResponse.json({ error: tokenError }, { status: 401 })
  }

  const config = getSupabasePublicConfig()
  if (!config) return NextResponse.json({ error: 'Missing Supabase URL or anon key' }, { status: 500 })

  const supabase = createSupabaseClient(config)
  const { data, error } = await runWithBooksTableFallback((table) =>
    supabase
      .from(table)
      .select('id, is_published, online_purchase_enabled, download_url')
      .eq('id', payload.bookId)
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
  if (!book.is_published || !book.online_purchase_enabled || !book.download_url) {
    return NextResponse.json({ error: 'Download is not available for this book.' }, { status: 400 })
  }
  if (!isTrustedDownloadUrl(book.download_url, config.supabaseUrl)) {
    return NextResponse.json({ error: 'Invalid download source configured for this book.' }, { status: 400 })
  }

  const source = await fetch(book.download_url, { cache: 'no-store' })
  if (!source.ok || !source.body) {
    return NextResponse.json({ error: 'Unable to fetch the book file right now.' }, { status: 502 })
  }

  const filename = inferFilenameFromUrl(book.download_url)
  const contentType = source.headers.get('content-type') || 'application/octet-stream'

  return new NextResponse(source.body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
