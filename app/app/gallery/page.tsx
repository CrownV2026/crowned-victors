import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { getSupabasePublicConfig } from '../../lib/supabaseConfig'

export const dynamic = 'force-dynamic'

type ContentRow = {
  slug: string
  title: string | null
  subtitle: string | null
  metadata: Record<string, any> | null
}

function isMissingTableError(error: any) {
  const msg = String(error?.message || '').toLowerCase()
  return msg.includes('could not find the table') || (msg.includes('relation') && msg.includes('does not exist'))
}

async function getGalleryContent(): Promise<ContentRow | null> {
  const config = getSupabasePublicConfig()
  if (!config) return null

  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  for (const table of ['content', 'posts', 'post']) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('slug', 'gallery')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (data) return data as ContentRow
    if (error && !isMissingTableError(error)) continue
  }

  return null
}

function parseImageList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((url): url is string => typeof url === 'string' && Boolean(url.trim()))
      .map((url) => url.trim())
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed
          .filter((url): url is string => typeof url === 'string' && Boolean(url.trim()))
          .map((url) => url.trim())
      }
    } catch {
      return []
    }
  }

  return []
}

export default async function GalleryPage() {
  const gallery = await getGalleryContent()
  const heading = gallery?.metadata?.galleryHeading || gallery?.title || 'Gallery'
  const description = gallery?.metadata?.galleryDescription || gallery?.subtitle || 'Moments from worship, fellowship, outreach, and ministry gatherings.'
  const images = parseImageList(gallery?.metadata?.galleryImages || gallery?.metadata?.galleryImagesJson)

  return (
    <main className="min-h-screen bg-[linear-gradient(155deg,_#fcfbf5_0%,_#f3edd9_48%,_#fefcf4_100%)] px-4 py-10 text-[#0B1F3A] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{heading}</h1>
          <Link href="/app" className="rounded-full border border-[#D4AF37]/40 bg-white/85 px-4 py-2 text-sm font-semibold text-[#0B1F3A] transition hover:border-[#D4AF37] hover:bg-white">
            Back to home
          </Link>
        </div>

        <p className="max-w-3xl text-base leading-7 text-[#0B1F3A]/75 sm:text-lg">{description}</p>

        {images.length > 0 ? (
          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((url, index) => (
              <figure key={`${url}-${index}`} className="overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-white/85 shadow-sm">
                <img src={url} alt={`Gallery image ${index + 1}`} className="h-64 w-full object-cover" />
              </figure>
            ))}
          </section>
        ) : (
          <section className="mt-8 rounded-2xl border border-dashed border-[#D4AF37]/45 bg-white/85 p-6 text-[#0B1F3A]/75">
            No gallery images have been uploaded yet. Add images from the admin editor for the gallery slug.
          </section>
        )}
      </div>
    </main>
  )
}
