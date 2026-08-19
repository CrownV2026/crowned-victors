import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { getSupabasePublicConfig } from '../../lib/supabaseConfig'

export const dynamic = 'force-dynamic'

type ContentRow = {
  metadata: Record<string, unknown> | null
}

type EmpowermentWord = {
  month: string
  title: string
  scripture: string
  body: string
}

function isMissingTableError(error: unknown) {
  const message = String((error as { message?: string } | null)?.message || '').toLowerCase()
  return message.includes('could not find the table') || (message.includes('relation') && message.includes('does not exist'))
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
      .select('metadata')
      .eq('slug', slug)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (data) return data as ContentRow
    if (error && !isMissingTableError(error)) continue
  }

  return null
}

function normalizeWords(value: unknown): EmpowermentWord[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      const record = item as Record<string, unknown>
      return {
        month: typeof record.month === 'string' ? record.month.trim() : '',
        title: typeof record.title === 'string' ? record.title.trim() : '',
        scripture: typeof record.scripture === 'string' ? record.scripture.trim() : '',
        body: typeof record.body === 'string' ? record.body.trim() : '',
      }
    })
    .filter((word) => Boolean(word.month && word.title && word.body))
    .sort((first, second) => second.month.localeCompare(first.month))
}

function formatMonth(month: string) {
  const date = new Date(`${month}-01T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return month
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date)
}

function WordBody({ body }: { body: string }) {
  return body.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => (
    <p key={index}>{paragraph}</p>
  ))
}

export default async function EmpowermentPage() {
  const [content, home] = await Promise.all([getContent('monthly-empowerment'), getContent('home')])
  const words = normalizeWords(content?.metadata?.empowermentWords)
  const [currentWord, ...previousWords] = words
  const backgroundImage = typeof home?.metadata?.homeBackgroundImage === 'string'
    ? home.metadata.homeBackgroundImage.trim()
    : ''
  const pageStyle = backgroundImage ? {
    backgroundImage: `linear-gradient(rgba(255,255,255,0.18), rgba(255,255,255,0.18)), url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  } as const : undefined

  return (
    <main className="min-h-screen bg-[#f7f3e8] bg-cover bg-center px-4 py-8 text-[#0B1F3A] sm:px-6 lg:px-10" style={pageStyle}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white/35 p-5 backdrop-blur-sm">
          <div>
            <p className="text-sm font-bold uppercase text-[#9a7620]">Crowned Victors</p>
            <h1 className="mt-1 text-3xl font-black sm:text-4xl">Weekly Devotional</h1>
          </div>
          <Link href="/" className="rounded-full border border-[#D4AF37]/50 bg-white/40 px-4 py-2 text-sm font-bold transition hover:bg-white/60">
            Back to home
          </Link>
        </header>

        {currentWord ? (
          <article className="rounded-lg border border-[#D4AF37]/40 bg-white/45 p-6 shadow-lg backdrop-blur-sm sm:p-10">
            <p className="text-sm font-bold uppercase text-[#9a7620]">{formatMonth(currentWord.month)}</p>
            <h2 className="mt-3 text-3xl font-black sm:text-5xl">{currentWord.title}</h2>
            {currentWord.scripture ? (
              <blockquote className="mt-6 border-l-4 border-[#D4AF37] bg-[#071526]/70 px-5 py-4 text-lg font-semibold italic text-white">
                {currentWord.scripture}
              </blockquote>
            ) : null}
            <div className="mt-7 space-y-5 whitespace-pre-line text-lg leading-8 text-[#0B1F3A]/90">
              <WordBody body={currentWord.body} />
            </div>
          </article>
        ) : (
          <section className="rounded-lg border border-dashed border-[#D4AF37]/60 bg-white/40 p-8 text-lg backdrop-blur-sm">
            This week&apos;s devotional will appear here once it is published.
          </section>
        )}

        {previousWords.length > 0 ? (
          <section className="mt-10 rounded-lg bg-white/35 p-5 backdrop-blur-sm sm:p-8">
            <h2 className="text-2xl font-black">Previous Devotionals</h2>
            <div className="mt-5 space-y-3">
              {previousWords.map((word) => (
                <details key={`${word.month}-${word.title}`} className="group rounded-lg border border-[#D4AF37]/35 bg-white/40 p-5 open:bg-white/55">
                  <summary className="cursor-pointer list-none font-bold">
                    <span className="text-sm uppercase text-[#9a7620]">{formatMonth(word.month)}</span>
                    <span className="mt-1 block text-xl text-[#0B1F3A]">{word.title}</span>
                  </summary>
                  {word.scripture ? <blockquote className="mt-5 border-l-4 border-[#D4AF37] pl-4 font-semibold italic">{word.scripture}</blockquote> : null}
                  <div className="mt-5 space-y-4 whitespace-pre-line leading-7 text-[#0B1F3A]/85">
                    <WordBody body={word.body} />
                  </div>
                </details>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}