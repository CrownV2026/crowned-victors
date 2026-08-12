import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabasePublicConfig } from '../../../lib/supabaseConfig'

const RAW_BUCKETS = [
  process.env.SUPABASE_STORAGE_BUCKET,
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET,
  'images',
  'Images',
]

const BUCKET_CANDIDATES = RAW_BUCKETS
  .filter(Boolean)
  .map((name) => String(name).trim())
  .filter((name, idx, arr) => Boolean(name) && arr.indexOf(name) === idx)

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function isBucketNotFoundError(message: string) {
  const normalized = message.toLowerCase()
  return normalized.includes('bucket not found') || normalized.includes('not found') && normalized.includes('bucket')
}

async function getUserFromRequest(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const headerToken = auth.startsWith('Bearer ') ? auth.split(' ')[1] : null
  const cookieToken = req.cookies.get('sb-access-token')?.value || null
  const token = headerToken || cookieToken
  if (!token) return null

  const config = getSupabasePublicConfig()
  if (!config) return null

  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data, error } = await supabase.auth.getUser(token)
  if (error) return null
  return { user: data.user, token }
}

export async function POST(req: NextRequest) {
  try {
    const config = getSupabasePublicConfig()
    if (!config) {
      return NextResponse.json({ error: 'Missing Supabase URL or anon key' }, { status: 500 })
    }

    const authResult = await getUserFromRequest(req)
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user, token } = authResult

    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }

    const safeName = sanitizeFileName(file.name || 'upload.bin')
    const path = `${user.id}/${Date.now()}-${safeName}`

    const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    let selectedBucket: string | null = null
    let lastUploadError: Error | null = null

    for (const bucket of BUCKET_CANDIDATES) {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          headers: { Authorization: `Bearer ${token}` },
        })

      if (!uploadError) {
        selectedBucket = bucket
        lastUploadError = null
        break
      }

      lastUploadError = uploadError
      if (!isBucketNotFoundError(uploadError.message || '')) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 })
      }
    }

    if (!selectedBucket) {
      const attemptedBuckets = BUCKET_CANDIDATES.join(', ')
      const baseError = lastUploadError?.message || 'Bucket not found'
      const guidance = `Set SUPABASE_STORAGE_BUCKET (or NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET) to an existing Supabase Storage bucket. Attempted: ${attemptedBuckets}`
      return NextResponse.json({ error: `${baseError}. ${guidance}` }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from(selectedBucket).getPublicUrl(path)

    return NextResponse.json({ path, url: urlData.publicUrl, bucket: selectedBucket })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
