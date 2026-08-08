import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../lib/supabaseServer'

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
    if (!user || user.user_metadata?.role !== 'admin') {
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
    if (!user || user.user_metadata?.role !== 'admin') {
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
    if (!user || user.user_metadata?.role !== 'admin') {
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
