import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../lib/supabaseServer'

const DEFAULT_ADMIN_EMAILS = ['crownedvictors2019@gmail.com']

type AuthUserLike = {
  email?: string | null
  user_metadata?: Record<string, unknown> | null
  app_metadata?: Record<string, unknown> | null
}

function getRole(user: AuthUserLike) {
  const userRole = typeof user.user_metadata?.role === 'string' ? user.user_metadata.role : ''
  const appRole = typeof user.app_metadata?.role === 'string' ? user.app_metadata.role : ''
  return (userRole || appRole).toLowerCase()
}

function isAllowedAdmin(user: AuthUserLike) {
  if (getRole(user) === 'admin') return true

  const configured = new Set([
    ...DEFAULT_ADMIN_EMAILS,
    ...(process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  ])

  if (!configured.size) return false
  const currentEmail = (user.email || '').trim().toLowerCase()
  return Boolean(currentEmail && configured.has(currentEmail))
}

async function getUserFromRequest(req: Request) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.split(' ')[1] : null
  if (!token) return null

  const adminClient = getAdminClient()
  const { data, error } = await adminClient.auth.getUser(token)
  if (error) return null
  return data.user
}

function getAdminClient() {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client unavailable')
  }
  return supabaseAdmin
}

export async function GET(req: Request) {
  try {
    const adminClient = getAdminClient()
    const url = new URL(req.url)
    const slug = url.searchParams.get('slug')
    if (slug) {
      const { data, error } = await adminClient.from('content').select('*').eq('slug', slug).maybeSingle()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }
    const { data, error } = await adminClient.from('content').select('*').order('updated_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Supabase admin client unavailable' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const adminClient = getAdminClient()
    const user = await getUserFromRequest(req)
    if (!user || !isAllowedAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json()
    const { data, error } = await adminClient.from('content').insert([{ ...body }]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Supabase admin client unavailable' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const adminClient = getAdminClient()
    const user = await getUserFromRequest(req)
    if (!user || !isAllowedAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const { data, error } = await adminClient.from('content').update(rest).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Supabase admin client unavailable' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const adminClient = getAdminClient()
    const user = await getUserFromRequest(req)
    if (!user || !isAllowedAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const { error } = await adminClient.from('content').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Supabase admin client unavailable' }, { status: 500 })
  }
}
