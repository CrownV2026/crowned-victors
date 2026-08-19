import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { getSupabasePublicConfig } from '../../lib/supabaseConfig'

export const dynamic = 'force-dynamic'

type ContentRow = {
  slug: string
  title: string | null
  subtitle: string | null
  metadata: Record<string, unknown> | null
}

type SermonItem = {
  title: string
  speaker: string
  date: string
  description: string
  videoUrl: string
  thumbnailUrl: string
}

function isMissingTableError(error: unknown) {
  const msg = String((error as { message?: string } | null)?.message || '').toLowerCase()
  return msg.includes('could not find the table') || (msg.includes('relation') && msg.includes('does not exist'))
}

function normalizeSermons(value: unknown): SermonItem[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      const record = item as Record<string, unknown>
      return {
        title: typeof record.title === 'string' ? record.title : '',
        speaker: typeof record.speaker === 'string' ? record.speaker : '',
        date: typeof record.date === 'string' ? record.date : '',
        description: typeof record.description === 'string' ? record.description : '',
        videoUrl: typeof record.videoUrl === 'string' ? record.videoUrl : '',
        thumbnailUrl: typeof record.thumbnailUrl === 'string' ? record.thumbnailUrl : '',
      }
    })
    .filter((item) => Boolean(item.videoUrl))
}

async function getContent(slug: string): Promise<ContentRow | null> {
  const config = getSupabasePublicConfig()
  if (!config) return null

  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  for (const table of ['content', 'posts', 'post']) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('slug', slug)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (data) return data as ContentRow
    if (error && !isMissingTableError(error)) continue
  }

  return null
}

export default async function SermonsPage() {
  const [sermonsContent, home] = await Promise.all([getContent('sermons'), getContent('home')])
  const metadata = sermonsContent?.metadata || {}

  const heading = typeof metadata.sermonsHeading === 'string' && metadata.sermonsHeading.trim()
    ? metadata.sermonsHeading
    : (sermonsContent?.title || 'Sermons')

  const description = typeof metadata.sermonsDescription === 'string' && metadata.sermonsDescription.trim()
    ? metadata.sermonsDescription
    : (sermonsContent?.subtitle || 'Watch recent messages and be encouraged in your faith journey.')

  const sermons = normalizeSermons(metadata.sermons)
  const backgroundImage = typeof home?.metadata?.homeBackgroundImage === 'string'
    ? home.metadata.homeBackgroundImage.trim()
    : ''
  const pageStyle = backgroundImage ? {
    backgroundImage: `linear-gradient(rgba(255,255,255,0.28), rgba(255,255,255,0.28)), url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  } as const : undefined

  return (
    <main className="min-h-screen bg-[#f7f3e8] bg-cover bg-center px-4 py-10 text-[#0B1F3A] sm:px-6 lg:px-8" style={pageStyle}>
      <div className="mx-auto max-w-7xl rounded-2xl bg-white/35 p-5 backdrop-blur-sm sm:p-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{heading}</h1>
            <Link href="/" className="rounded-full border border-[#D4AF37]/40 bg-white/35 px-4 py-2 text-sm font-semibold text-[#0B1F3A] transition hover:border-[#D4AF37] hover:bg-white/50">
            Back to home
          </Link>
        </div>

        <p className="max-w-3xl text-base leading-7 text-[#0B1F3A]/75 sm:text-lg">{description}</p>

        {sermons.length > 0 ? (
          <section className="mt-8 grid gap-6 lg:grid-cols-2">
            {sermons.map((sermon, index) => (
              <article key={`${sermon.title || 'sermon'}-${index}`} className="overflow-hidden rounded-2xl border border-[#D4AF37]/25 bg-white/35 shadow-sm backdrop-blur-sm">
                <video
                  controls
                  preload="metadata"
                  poster={sermon.thumbnailUrl || undefined}
                  className="h-56 w-full bg-black object-cover"
                  src={sermon.videoUrl}
                />
                <div className="p-5">
                  <h2 className="text-xl font-semibold text-[#0B1F3A]">{sermon.title || `Sermon ${index + 1}`}</h2>
                  <p className="mt-2 text-sm font-medium uppercase tracking-[0.18em] text-[#0B1F3A]/60">
                    {sermon.speaker ? `${sermon.speaker}` : 'Crowned Victors Ministry'}
                    {sermon.date ? ` • ${sermon.date}` : ''}
                  </p>
                  {sermon.description ? <p className="mt-3 text-base leading-7 text-[#0B1F3A]/75">{sermon.description}</p> : null}
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="mt-8 rounded-2xl border border-dashed border-[#D4AF37]/45 bg-white/35 p-6 text-[#0B1F3A]/75">
            No sermons have been published yet.
          </section>
        )}
      </div>
    </main>
  )
}
