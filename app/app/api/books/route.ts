import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabasePublicConfig } from '../../../lib/supabaseConfig'

type DbBookRow = {
  id: string
  title: string
  author: string | null
  cover_image_url: string | null
  short_description: string | null
  full_description: string | null
  price: number | string | null
  currency: string | null
  status: string | null
  isbn: string | null
  published_date: string | null
  is_published: boolean | null
  online_purchase_enabled: boolean | null
  hard_copy_enabled: boolean | null
  payment_provider_name: string | null
  payment_url: string | null
  payment_instructions: string | null
  download_url: string | null
  delivery_contact_link: string | null
  delivery_instructions: string | null
  sort_order: number | null
  created_at: string
  updated_at: string
}

type BookPayload = {
  id?: string
  title?: string
  author?: string
  coverImageUrl?: string
  description?: string
  shortDescription?: string
  fullDescription?: string
  price?: number | string
  currency?: string
  status?: string
  isbn?: string
  publishedDate?: string
  isPublished?: boolean
  onlinePurchaseEnabled?: boolean
  hardCopyEnabled?: boolean
  paymentProviderName?: string
  paymentUrl?: string
  paymentInstructions?: string
  downloadUrl?: string
  deliveryContactLink?: string
  deliveryInstructions?: string
  sortOrder?: number
}

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

async function requireAdmin(req: NextRequest, config: { supabaseUrl: string; supabaseAnonKey: string }) {
  const token = getToken(req)
  if (!token) return null

  const supabase = createSupabaseClient(config, token)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null

  const role = data.user.user_metadata?.role
  if (role !== 'admin') return null

  return { token, user: data.user }
}

function toNumber(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return 0
  return parsed
}

function toTrimmedString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function toDbBook(payload: BookPayload) {
  const description = toTrimmedString(payload.description || payload.shortDescription)
  return {
    title: toTrimmedString(payload.title),
    author: toTrimmedString(payload.author) || null,
    cover_image_url: toTrimmedString(payload.coverImageUrl) || null,
    short_description: description || null,
    full_description: toTrimmedString(payload.fullDescription) || null,
    price: toNumber(payload.price),
    currency: toTrimmedString(payload.currency || 'USD') || 'USD',
    status: toTrimmedString(payload.status || 'Available') || 'Available',
    isbn: toTrimmedString(payload.isbn) || null,
    published_date: toTrimmedString(payload.publishedDate) || null,
    is_published: typeof payload.isPublished === 'boolean' ? payload.isPublished : true,
    online_purchase_enabled: typeof payload.onlinePurchaseEnabled === 'boolean' ? payload.onlinePurchaseEnabled : true,
    hard_copy_enabled: typeof payload.hardCopyEnabled === 'boolean' ? payload.hardCopyEnabled : true,
    payment_provider_name: toTrimmedString(payload.paymentProviderName) || null,
    payment_url: toTrimmedString(payload.paymentUrl) || null,
    payment_instructions: toTrimmedString(payload.paymentInstructions) || null,
    download_url: toTrimmedString(payload.downloadUrl) || null,
    delivery_contact_link: toTrimmedString(payload.deliveryContactLink) || null,
    delivery_instructions: toTrimmedString(payload.deliveryInstructions) || null,
    sort_order: Number.isInteger(payload.sortOrder) ? payload.sortOrder : 0,
  }
}

function fromDbBook(row: DbBookRow) {
  return {
    id: row.id,
    title: row.title,
    author: row.author || '',
    coverImageUrl: row.cover_image_url || '',
    description: row.short_description || '',
    shortDescription: row.short_description || '',
    fullDescription: row.full_description || '',
    price: Number(row.price || 0),
    currency: row.currency || 'USD',
    status: row.status || 'Available',
    isbn: row.isbn || '',
    publishedDate: row.published_date || '',
    isPublished: Boolean(row.is_published),
    onlinePurchaseEnabled: Boolean(row.online_purchase_enabled),
    hardCopyEnabled: Boolean(row.hard_copy_enabled),
    paymentProviderName: row.payment_provider_name || '',
    paymentUrl: row.payment_url || '',
    paymentInstructions: row.payment_instructions || '',
    downloadUrl: row.download_url || '',
    deliveryContactLink: row.delivery_contact_link || '',
    deliveryInstructions: row.delivery_instructions || '',
    sortOrder: row.sort_order || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function GET(req: NextRequest) {
  const config = getConfig()
  if (!config) return NextResponse.json({ error: 'Missing Supabase URL or anon key' }, { status: 500 })

  const includeAll = new URL(req.url).searchParams.get('admin') === '1'
  const auth = includeAll ? await requireAdmin(req, config) : null
  const supabase = createSupabaseClient(config, auth?.token)

  let query = supabase.from('books').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true })

  if (!(includeAll && auth)) {
    query = query.eq('is_published', true)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const books = ((data || []) as DbBookRow[]).map(fromDbBook)
  return NextResponse.json({ books })
}

export async function POST(req: NextRequest) {
  const config = getConfig()
  if (!config) return NextResponse.json({ error: 'Missing Supabase URL or anon key' }, { status: 500 })

  const auth = await requireAdmin(req, config)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as BookPayload
  const payload = toDbBook(body)

  if (!payload.title) {
    return NextResponse.json({ error: 'Book title is required' }, { status: 400 })
  }

  const supabase = createSupabaseClient(config, auth.token)
  const { data, error } = await supabase.from('books').insert([payload]).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(fromDbBook(data as DbBookRow))
}

export async function PUT(req: NextRequest) {
  const config = getConfig()
  if (!config) return NextResponse.json({ error: 'Missing Supabase URL or anon key' }, { status: 500 })

  const auth = await requireAdmin(req, config)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as BookPayload | { books?: BookPayload[] }
  const supabase = createSupabaseClient(config, auth.token)

  if ('books' in body && Array.isArray(body.books)) {
    const saved: DbBookRow[] = []

    for (const entry of body.books) {
      const payload = toDbBook(entry)
      if (!payload.title) continue

      if (entry.id) {
        const { data, error } = await supabase.from('books').update(payload).eq('id', entry.id).select('*').single()
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        saved.push(data as DbBookRow)
      } else {
        const { data, error } = await supabase.from('books').insert([payload]).select('*').single()
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        saved.push(data as DbBookRow)
      }
    }

    return NextResponse.json({ books: saved.map(fromDbBook) })
  }

  const single = body as BookPayload
  if (!single.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const payload = toDbBook(single)
  if (!payload.title) return NextResponse.json({ error: 'Book title is required' }, { status: 400 })

  const { data, error } = await supabase.from('books').update(payload).eq('id', single.id).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(fromDbBook(data as DbBookRow))
}

export async function DELETE(req: NextRequest) {
  const config = getConfig()
  if (!config) return NextResponse.json({ error: 'Missing Supabase URL or anon key' }, { status: 500 })

  const auth = await requireAdmin(req, config)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = createSupabaseClient(config, auth.token)
  const { error } = await supabase.from('books').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
