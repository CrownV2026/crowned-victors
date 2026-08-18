import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabasePublicConfig, getSupabaseServiceConfig } from '../../../lib/supabaseConfig'

const RAW_IMAGE_BUCKETS = [
  process.env.SUPABASE_STORAGE_BUCKET,
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET,
  'images',
  'Images',
]

const RAW_BOOK_BUCKETS = [
  process.env.SUPABASE_BOOKS_STORAGE_BUCKET,
  process.env.NEXT_PUBLIC_SUPABASE_BOOKS_STORAGE_BUCKET,
  'books',
  'book-files',
]

function toBucketCandidates(values: Array<string | undefined>) {
  return values
    .filter(Boolean)
    .map((name) => String(name).trim())
    .filter((name, idx, arr) => Boolean(name) && arr.indexOf(name) === idx)
}

const IMAGE_BUCKET_CANDIDATES = toBucketCandidates(RAW_IMAGE_BUCKETS)
const BOOK_BUCKET_CANDIDATES = toBucketCandidates(RAW_BOOK_BUCKETS)

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function getBucketCandidatesForFileType(fileType: string) {
  const isImage = fileType.toLowerCase().startsWith('image/')
  if (isImage) return IMAGE_BUCKET_CANDIDATES

  const merged = [...BOOK_BUCKET_CANDIDATES, ...IMAGE_BUCKET_CANDIDATES]
  return merged.filter((name, idx, arr) => arr.indexOf(name) === idx)
}

function isBucketNotFoundError(message: string) {
  const normalized = message.toLowerCase()
  return normalized.includes('bucket not found') || normalized.includes('not found') && normalized.includes('bucket')
}

function getTokenFromRequest(req: NextRequest, accessTokenFromBody?: unknown) {
  if (typeof accessTokenFromBody === 'string' && accessTokenFromBody.trim()) {
    return accessTokenFromBody.trim()
  }

  const auth = req.headers.get('authorization') || ''
  const headerToken = auth.startsWith('Bearer ') ? auth.split(' ')[1] : null
  const cookieToken = req.cookies.get('sb-access-token')?.value || null
  return headerToken || cookieToken
}

async function getUserFromToken(token: string | null) {
  if (!token) return null

  const config = getSupabasePublicConfig()
  if (!config) return null

  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}

export async function POST(req: NextRequest) {
  try {
    const publicConfig = getSupabasePublicConfig()
    const serviceConfig = getSupabaseServiceConfig()

    if (!publicConfig) {
      return NextResponse.json({ error: 'Missing Supabase URL or anon key' }, { status: 500 })
    }

    if (!serviceConfig) {
      return NextResponse.json({ error: 'Missing Supabase service role key' }, { status: 500 })
    }

    const body = await req.json().catch(() => null)
    const token = getTokenFromRequest(req, body?.accessToken)
    const user = await getUserFromToken(token)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fileName = typeof body?.fileName === 'string' && body.fileName.trim() ? body.fileName.trim() : 'upload.bin'
    const fileType = typeof body?.fileType === 'string' && body.fileType.trim()
      ? body.fileType.trim().toLowerCase()
      : 'application/octet-stream'

    const safeName = sanitizeFileName(fileName)
    const path = `${user.id}/${Date.now()}-${safeName}`

    const supabaseAdmin = createClient(serviceConfig.supabaseUrl, serviceConfig.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const bucketCandidates = getBucketCandidatesForFileType(fileType)

    let selectedBucket: string | null = null
    let uploadToken: string | null = null
    let lastUploadError: Error | null = null

    for (const bucket of bucketCandidates) {
      const { data, error: uploadError } = await supabaseAdmin.storage
        .from(bucket)
        .createSignedUploadUrl(path, { upsert: false })

      if (!uploadError && data?.token) {
        selectedBucket = bucket
        uploadToken = data.token
        lastUploadError = null
        break
      }

      lastUploadError = uploadError || new Error('Could not generate signed upload URL')

      if (!uploadError) {
        continue
      }

      if (!isBucketNotFoundError(uploadError.message || '')) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 })
      }
    }

    if (!selectedBucket) {
      const attemptedBuckets = bucketCandidates.join(', ')
      const baseError = lastUploadError?.message || 'Bucket not found'
      const guidance = `Set SUPABASE_BOOKS_STORAGE_BUCKET/NEXT_PUBLIC_SUPABASE_BOOKS_STORAGE_BUCKET for book files (or SUPABASE_STORAGE_BUCKET/NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET for images). Attempted: ${attemptedBuckets}`
      return NextResponse.json({ error: `${baseError}. ${guidance}` }, { status: 500 })
    }

    if (!uploadToken) {
      return NextResponse.json({ error: 'Could not generate signed upload URL' }, { status: 500 })
    }

    const { data: urlData } = supabaseAdmin.storage.from(selectedBucket).getPublicUrl(path)

    return NextResponse.json({ path, url: urlData.publicUrl, bucket: selectedBucket, token: uploadToken })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
