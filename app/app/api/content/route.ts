import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabasePublicConfig } from '../../../lib/supabaseConfig'

const CONTENT_TABLES = [
  process.env.CONTENT_TABLE,
  process.env.CONTENT_TABLE_FALLBACK,
  'content',
  'posts',
  'post',
]
  .filter(Boolean)
  .map((name) => String(name).trim())
  .filter((name, idx, arr) => arr.indexOf(name) === idx)

function getConfig() {
  return getSupabasePublicConfig()
}

function getToken(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const headerToken = auth.startsWith('Bearer ') ? auth.split(' ')[1] : null
  const cookieToken = req.cookies.get('sb-access-token')?.value || null
  return headerToken || cookieToken
}

function createSupabaseClient(config: { supabaseUrl: string; supabaseAnonKey: string }, token?: string | null) {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  })
}

function isMissingTableError(error: any) {
  const msg = (error?.message || '').toLowerCase()
  return msg.includes('could not find the table') || msg.includes('relation') && msg.includes('does not exist')
}

async function runWithTableFallback<T>(
  operation: (table: string) => any
): Promise<{ data?: T; error: any }> {
  let lastResult: any = null

  for (const table of CONTENT_TABLES) {
    const result = await operation(table)
    if (!result.error) return result

    lastResult = result
    if (!isMissingTableError(result.error)) {
      return result
    }
  }

  if (lastResult) {
    return {
      ...lastResult,
      error: {
        ...lastResult.error,
        message: `None of these tables is available: ${CONTENT_TABLES.join(', ')}. Create one in Supabase.`,
      },
    }
  }
  return { data: undefined, error: { message: 'No content tables configured' } }
}

async function requireAuth(req: NextRequest, config: { supabaseUrl: string; supabaseAnonKey: string }) {
  const token = getToken(req)
  if (!token) return null
  const supabase = createSupabaseClient(config, token)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return { token, user: data.user }
}

export async function GET(req: NextRequest) {
  const config = getConfig()
  if (!config) {
    return NextResponse.json({ error: 'Missing Supabase URL or anon key' }, { status: 500 })
  }

  const supabase = createSupabaseClient(config)
  const url = new URL(req.url)
  const slug = url.searchParams.get('slug')

  if (slug) {
    const { data, error } = await runWithTableFallback((table) =>
      supabase.from(table).select('*').eq('slug', slug).maybeSingle()
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const { data, error } = await runWithTableFallback((table) =>
    supabase.from(table).select('*').order('updated_at', { ascending: false })
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const config = getConfig()
  if (!config) {
    return NextResponse.json({ error: 'Missing Supabase URL or anon key' }, { status: 500 })
  }

  const auth = await requireAuth(req, config)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const payload = { page: 'home', ...body }
  const supabase = createSupabaseClient(config, auth.token)
  const { data, error } = await runWithTableFallback((table) =>
    supabase.from(table).insert([payload]).select().single()
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const config = getConfig()
  if (!config) {
    return NextResponse.json({ error: 'Missing Supabase URL or anon key' }, { status: 500 })
  }

  const auth = await requireAuth(req, config)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, ...rest } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = createSupabaseClient(config, auth.token)
  const { data, error } = await runWithTableFallback((table) =>
    supabase.from(table).update(rest).eq('id', id).select().single()
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const config = getConfig()
  if (!config) {
    return NextResponse.json({ error: 'Missing Supabase URL or anon key' }, { status: 500 })
  }

  const auth = await requireAuth(req, config)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = createSupabaseClient(config, auth.token)
  const { error } = await runWithTableFallback((table) =>
    supabase.from(table).delete().eq('id', id)
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
