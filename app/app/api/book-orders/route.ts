import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabasePublicConfig } from '../../../lib/supabaseConfig'

const ORDER_STATUSES = [
  'Pending',
  'Payment received',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
] as const

type OrderStatus = (typeof ORDER_STATUSES)[number]

type OrderPayload = {
  id?: string
  bookId?: string
  customerName?: string
  phone?: string
  email?: string
  quantity?: number | string
  deliveryAddress?: string
  cityTown?: string
  country?: string
  additionalInstructions?: string
  status?: OrderStatus
}

type DbOrderRow = {
  id: string
  book_id: string
  book_title_snapshot: string
  customer_name: string
  phone: string
  email: string
  quantity: number
  delivery_address: string
  city_town: string
  country: string
  additional_instructions: string | null
  status: OrderStatus
  created_at: string
  updated_at: string
  books?: { title: string | null } | null
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

function toTrimmedString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function toQuantity(value: unknown) {
  const quantity = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(quantity) || quantity < 1) return 1
  return Math.floor(quantity)
}

function fromDbOrder(row: DbOrderRow) {
  return {
    id: row.id,
    bookId: row.book_id,
    bookTitle: row.books?.title || row.book_title_snapshot,
    customerName: row.customer_name,
    phone: row.phone,
    email: row.email,
    quantity: row.quantity,
    deliveryAddress: row.delivery_address,
    cityTown: row.city_town,
    country: row.country,
    additionalInstructions: row.additional_instructions || '',
    status: row.status,
    orderDate: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function GET(req: NextRequest) {
  const config = getConfig()
  if (!config) return NextResponse.json({ error: 'Missing Supabase URL or anon key' }, { status: 500 })

  const auth = await requireAdmin(req, config)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createSupabaseClient(config, auth.token)
  const { data, error } = await supabase
    .from('book_orders')
    .select('*, books(title)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ orders: ((data || []) as DbOrderRow[]).map(fromDbOrder), statuses: ORDER_STATUSES })
}

export async function POST(req: NextRequest) {
  const config = getConfig()
  if (!config) return NextResponse.json({ error: 'Missing Supabase URL or anon key' }, { status: 500 })

  const supabase = createSupabaseClient(config)
  const body = (await req.json()) as OrderPayload

  const bookId = toTrimmedString(body.bookId)
  const customerName = toTrimmedString(body.customerName)
  const phone = toTrimmedString(body.phone)
  const email = toTrimmedString(body.email)
  const deliveryAddress = toTrimmedString(body.deliveryAddress)
  const cityTown = toTrimmedString(body.cityTown)
  const country = toTrimmedString(body.country)

  if (!bookId || !customerName || !phone || !email || !deliveryAddress || !cityTown || !country) {
    return NextResponse.json({ error: 'Please provide all required delivery details.' }, { status: 400 })
  }

  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('id, title, is_published, hard_copy_enabled')
    .eq('id', bookId)
    .maybeSingle()

  if (bookError) return NextResponse.json({ error: bookError.message }, { status: 500 })
  if (!book) return NextResponse.json({ error: 'Book not found.' }, { status: 404 })
  if (!book.is_published || !book.hard_copy_enabled) {
    return NextResponse.json({ error: 'This book is not available for hard-copy ordering right now.' }, { status: 400 })
  }

  const payload = {
    book_id: book.id,
    book_title_snapshot: book.title,
    customer_name: customerName,
    phone,
    email,
    quantity: toQuantity(body.quantity),
    delivery_address: deliveryAddress,
    city_town: cityTown,
    country,
    additional_instructions: toTrimmedString(body.additionalInstructions) || null,
    status: 'Pending' as OrderStatus,
  }

  const { data, error } = await supabase.from('book_orders').insert([payload]).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(fromDbOrder(data as DbOrderRow), { status: 201 })
}

export async function PUT(req: NextRequest) {
  const config = getConfig()
  if (!config) return NextResponse.json({ error: 'Missing Supabase URL or anon key' }, { status: 500 })

  const auth = await requireAdmin(req, config)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as OrderPayload
  const id = toTrimmedString(body.id)
  const status = toTrimmedString(body.status) as OrderStatus

  if (!id) return NextResponse.json({ error: 'Missing order id' }, { status: 400 })
  if (!ORDER_STATUSES.includes(status)) return NextResponse.json({ error: 'Invalid order status' }, { status: 400 })

  const supabase = createSupabaseClient(config, auth.token)
  const { data, error } = await supabase
    .from('book_orders')
    .update({ status })
    .eq('id', id)
    .select('*, books(title)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(fromDbOrder(data as DbOrderRow))
}
