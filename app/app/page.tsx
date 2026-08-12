import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import BooksSection from '../components/BooksSection'
import { BookItem, normalizeBook } from '../lib/bookPurchase'
import { getSupabasePublicConfig } from '../lib/supabaseConfig'

export const dynamic = 'force-dynamic'

type ContentRow = {
  id: string
  slug: string
  page: string
  title: string | null
  subtitle: string | null
  body: unknown
  metadata: Record<string, unknown> | null
  banner_url: string | null
  updated_at: string | null
}

const CONTENT_TABLES = ['content', 'posts', 'post']
const RAW_BOOK_TABLES = [
  process.env.BOOKS_TABLE,
  process.env.BOOKS_TABLE_FALLBACK,
  'books',
  'public.books',
  'public books',
]

const BOOK_TABLES = RAW_BOOK_TABLES
  .flatMap((value) => {
    const trimmed = String(value || '').trim().replace(/"/g, '')
    if (!trimmed) return []

    const dotted = trimmed.replace(/\s+/g, '.')
    if (!dotted.includes('.')) return [dotted]

    const parts = dotted.split('.').filter(Boolean)
    const tableOnly = parts[parts.length - 1]
    return [dotted, tableOnly]
  })
  .filter((value, idx, arr) => arr.indexOf(value) === idx)

function isMissingTableError(error: unknown) {
  const msg = String((error as { message?: string } | null)?.message || '').toLowerCase()
  return msg.includes('could not find the table') || (msg.includes('relation') && msg.includes('does not exist'))
}

async function getContentBySlug(slug: string): Promise<ContentRow | null> {
  const config = getSupabasePublicConfig()
  if (!config) return null

  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  for (const table of CONTENT_TABLES) {
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

async function getPublishedBooks(): Promise<BookItem[] | null> {
  const config = getSupabasePublicConfig()
  if (!config) return null

  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  for (const table of BOOK_TABLES) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      if (isMissingTableError(error)) continue
      continue
    }

    if (!Array.isArray(data)) return []

    return data.map((row) => {
      const record = row as Record<string, unknown>
      return normalizeBook({
        id: toOptionalString(record.id),
        title: toOptionalString(record.title),
        author: toOptionalString(record.author),
        coverImageUrl: toOptionalString(record.cover_image_url),
        description: toOptionalString(record.short_description),
        fullDescription: toOptionalString(record.full_description),
        price: typeof record.price === 'string' || typeof record.price === 'number' ? record.price : undefined,
        currency: toOptionalString(record.currency),
        status: toOptionalString(record.status),
        isbn: toOptionalString(record.isbn),
        publishedDate: toOptionalString(record.published_date),
        isPublished: toOptionalBoolean(record.is_published),
        onlinePurchaseEnabled: toOptionalBoolean(record.online_purchase_enabled),
        hardCopyEnabled: toOptionalBoolean(record.hard_copy_enabled),
        paymentProviderName: toOptionalString(record.payment_provider_name),
        paymentUrl: toOptionalString(record.payment_url),
        paymentInstructions: toOptionalString(record.payment_instructions),
        downloadUrl: toOptionalString(record.download_url),
        deliveryContactLink: toOptionalString(record.delivery_contact_link),
        deliveryInstructions: toOptionalString(record.delivery_instructions),
        sortOrder: toOptionalNumber(record.sort_order),
      })
    })
  }

  return null
}

function normalizeBodyText(body: unknown) {
  if (typeof body === 'string' && body.trim()) return body
  if (Array.isArray(body)) {
    const joined = body.filter((item) => typeof item === 'string').join('\n\n').trim()
    if (joined) return joined
  }
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>
    if (typeof record.text === 'string' && record.text.trim()) return record.text
    if (typeof record.content === 'string' && record.content.trim()) return record.content
  }
  return null
}

function toOptionalString(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function toOptionalBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : undefined
}

function toOptionalNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function toText(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function toStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback
  const items = value
    .filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
    .map((item) => item.trim())
  return items.length > 0 ? items : fallback
}

function toMinistryArray(value: unknown, fallback: Array<{ title: string; description: string }>) {
  if (!Array.isArray(value)) return fallback
  const items = value
    .map((item) => {
      const record = item as Record<string, unknown>
      const title = typeof record.title === 'string' ? record.title.trim() : ''
      const description = typeof record.description === 'string' ? record.description.trim() : ''
      return { title, description }
    })
    .filter((item) => Boolean(item.title) && Boolean(item.description))
  return items.length > 0 ? items : fallback
}

function toEventArray(value: unknown, fallback: Array<{ title: string; detail: string }>) {
  if (!Array.isArray(value)) return fallback
  const items = value
    .map((item) => {
      const record = item as Record<string, unknown>
      const title = typeof record.title === 'string' ? record.title.trim() : ''
      const detail = typeof record.detail === 'string' ? record.detail.trim() : ''
      return { title, detail }
    })
    .filter((item) => Boolean(item.title) && Boolean(item.detail))
  return items.length > 0 ? items : fallback
}

function parseMetadataJson(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

const DEFAULT_MINISTRIES = [
  { title: "Prayer & Intercession", description: "Dedicated seasons of prayer, healing, and spiritual breakthrough." },
  { title: "Discipleship", description: "Biblical teaching that equips believers to walk in purpose and power." },
  { title: "Outreach & Service", description: "Serving communities with compassion, generosity, and kingdom love." },
]

const DEFAULT_EVENTS = [
  { title: "Midweek Prayer Gathering", detail: "Wednesdays · 7:00 PM · Online & In Person" },
  { title: "Women of Valor Retreat", detail: "September 14 · 10:00 AM · The Harbor House" },
  { title: "Kingdom Leadership Forum", detail: "October 5 · 6:30 PM · Community Hall" },
]

const DEFAULT_BOOKS = [
  {
    title: "Seek My Face",
    author: "Crowned Victors",
    description: "A devotional journey into intimacy, worship, and spiritual hunger.",
    status: "Available",
    isPublished: true,
    onlinePurchaseEnabled: true,
    hardCopyEnabled: true,
    paymentProviderName: '',
    paymentUrl: '#',
    paymentInstructions: '',
    buyLabel: "Buy Online",
    orderLabel: "Purchase Hard Copy",
  },
  {
    title: "Spirit Forged Arsenal",
    author: "Crowned Victors",
    description: "A powerful resource for spiritual warfare, resilience, and holy boldness.",
    status: "Coming Soon",
    isPublished: true,
    onlinePurchaseEnabled: false,
    hardCopyEnabled: false,
    paymentProviderName: '',
    paymentUrl: '',
    paymentInstructions: '',
    buyLabel: "Buy Online",
    orderLabel: "Purchase Hard Copy",
  },
]

const DEFAULT_FAITH_POINTS = [
  "We believe the Bible is the inspired and infallible Word of God.",
  "We believe in the Trinity: Father, Son, and Holy Spirit.",
  "We believe salvation is by grace through faith in Jesus Christ.",
  "We believe in the power of prayer, healing, and the Holy Spirit's work today.",
]

export default async function Home() {
  // Fetch each slug in parallel — matches the admin dashboard's separate slug pages
  const [home, galleryRow, aboutRow, visionRow, missionRow, faithRow, ministriesRow, eventsRow, booksRow, contactRow, scriptureRow, publishedBooks] = await Promise.all([
    getContentBySlug('home'),
    getContentBySlug('gallery'),
    getContentBySlug('about'),
    getContentBySlug('vision'),
    getContentBySlug('mission'),
    getContentBySlug('statement-of-faith'),
    getContentBySlug('ministries'),
    getContentBySlug('events'),
    getContentBySlug('books-and-resources'),
    getContentBySlug('contacts'),
    getContentBySlug('scripture-banner'),
    getPublishedBooks(),
  ])

  // Helper: pick first truthy value from a slug's metadata, then from home's metadata, then the default
  const m = (row: ContentRow | null, key: string): unknown => row?.metadata?.[key] ?? home?.metadata?.[key]

  const heroTitle = home?.title || 'Crowned Victors'
  const heroSubtitle = home?.subtitle || 'Equipping the saints to walk in bold faith, spiritual authority, and kingdom purpose.'
  const aboutBody = normalizeBodyText(aboutRow?.body) || normalizeBodyText(home?.body)
  const scripture = toText(m(scriptureRow, 'scripture'), '"And I saw, and behold a white horse..." — Revelation 6:2')
  const heroCalloutTitle = toText(m(home, 'heroCalloutTitle'), 'Raising a people who live in victory, not fear.')
  const heroCalloutItems: string[] = toStringArray(home?.metadata?.heroCalloutItems, ['Prayer-centered worship and spiritual renewal', 'Kingdom discipleship for every generation', 'A strong culture of service, compassion, and impact'])
  const aboutWhy: string[] = toStringArray(m(aboutRow, 'aboutWhy'), ['We create space for prayer, worship, discipleship, and community so people can experience lasting renewal and purposeful devotion.', 'Every gathering is designed to strengthen believers and prepare them to impact homes, churches, and cities with hope.'])
  const visionTitle = toText(m(visionRow, 'visionTitle'), 'To raise a generation of crowned victors who shine with the glory of God.')
  const visionText = toText(m(visionRow, 'visionText'), 'We envision churches, homes, and communities filled with believers who walk in holiness, wisdom, and spiritual authority.')
  const missionTitle = toText(m(missionRow, 'missionTitle'), 'To equip the saints through prayer, teaching, worship, and service.')
  const missionText = toText(m(missionRow, 'missionText'), 'Our mission is to strengthen believers in their daily walk so they can stand firm, lead with integrity, and serve with love.')
  const faithPoints: string[] = toStringArray(m(faithRow, 'faithPoints'), DEFAULT_FAITH_POINTS)
  const ministries: Array<{ title: string; description: string }> = toMinistryArray(m(ministriesRow, 'ministries'), DEFAULT_MINISTRIES)
  const events: Array<{ title: string; detail: string }> = toEventArray(m(eventsRow, 'events'), DEFAULT_EVENTS)
  const galleryHeading = toText(m(galleryRow, 'galleryHeading'), 'Gallery')
  const galleryDescription = toText(m(galleryRow, 'galleryDescription'), 'Moments from worship, fellowship, outreach, and ministry gatherings.')
  const galleryImages: string[] = parseMetadataJson(m(galleryRow, 'galleryImages') || m(galleryRow, 'galleryImagesJson')).filter(
    (url): url is string => typeof url === 'string' && Boolean(url.trim())
  )
  const booksFromMetadataSource = m(booksRow, 'books')
  const booksFromMetadata: BookItem[] = Array.isArray(booksFromMetadataSource) && booksFromMetadataSource.length > 0
    ? booksFromMetadataSource.map((book) => normalizeBook(book as Partial<BookItem>))
    : DEFAULT_BOOKS.map((book) => normalizeBook(book))
  const books: BookItem[] = publishedBooks && publishedBooks.length > 0 ? publishedBooks : booksFromMetadata
  const booksSectionHeading = toText(booksRow?.metadata?.booksSectionHeading, 'Book Store')
  const booksSectionDescription = toText(booksRow?.metadata?.booksSectionDescription, 'Buy soft copies online or order hard copies for delivery.')
  const contactEmail = toText(m(contactRow, 'contactEmail'), 'hello@crownedvictorsministry.org')
  const contactPhone = toText(m(contactRow, 'contactPhone'), '+1 (234) 567-890')
  const contactLocation = toText(m(contactRow, 'contactLocation'), 'Serving communities with faith, prayer, and purpose')
  const bannerUrl = home?.banner_url || aboutRow?.banner_url
  const homeBackgroundImage = toText(m(home, 'homeBackgroundImage'), '')

  const homeSurfaceStyle = homeBackgroundImage
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(252,251,245,0.92) 0%, rgba(247,239,212,0.9) 45%, rgba(255,253,248,0.94) 100%), url(${homeBackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#fcfbf5_0%,_#f7efd4_45%,_#fffdf8_100%)] text-[#0B1F3A]" style={homeSurfaceStyle}>
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <a href="#home" className="text-sm font-semibold uppercase tracking-[0.35em] text-[#0B1F3A] sm:text-base">
          Crowned Victors
        </a>
        <nav className="hidden gap-6 text-sm font-medium text-[#0B1F3A]/80 md:flex">
          <a href="#about" className="transition hover:text-[#D4AF37]">
            About
          </a>
          <a href="#vision" className="transition hover:text-[#D4AF37]">
            Vision
          </a>
          <a href="#ministries" className="transition hover:text-[#D4AF37]">
            Ministries
          </a>
          <a href="/gallery" className="transition hover:text-[#D4AF37]">
            Gallery
          </a>
          <a href="/sermons" className="transition hover:text-[#D4AF37]">
            Sermons
          </a>
          <a href="#contact" className="transition hover:text-[#D4AF37]">
            Contact
          </a>
        </nav>
      </header>

      <nav className="mx-auto mb-4 flex max-w-7xl flex-wrap gap-3 px-4 text-sm font-medium text-[#0B1F3A]/85 sm:px-6 md:hidden lg:px-8">
        <a href="#about" className="transition hover:text-[#D4AF37]">
          About
        </a>
        <a href="#vision" className="transition hover:text-[#D4AF37]">
          Vision
        </a>
        <a href="#ministries" className="transition hover:text-[#D4AF37]">
          Ministries
        </a>
        <a href="/gallery" className="transition hover:text-[#D4AF37]">
          Gallery
        </a>
        <a href="/sermons" className="transition hover:text-[#D4AF37]">
          Sermons
        </a>
        <a href="#contact" className="transition hover:text-[#D4AF37]">
          Contact
        </a>
      </nav>

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-16 sm:px-6 lg:px-8 lg:gap-8 lg:pb-24">
        <section
          id="home"
          className="relative overflow-hidden rounded-[2rem] border border-[#D4AF37]/40 bg-[#0B1F3A] p-8 text-white shadow-[0_35px_100px_-35px_rgba(11,31,58,0.9)] sm:p-10 lg:p-14"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.22),_transparent_30%)]" />
          <div className="absolute right-[-6rem] top-[-4rem] h-40 w-40 rounded-full border border-[#D4AF37]/30" />
          <div className="absolute bottom-0 left-[-4rem] h-28 w-28 rounded-full border border-[#D4AF37]/20" />

          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="max-w-2xl">
              <span className="inline-flex rounded-full border border-[#D4AF37]/40 bg-white/10 px-3 py-1 text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
                Crowned Victors Ministry
              </span>
              <h1 className="mt-6 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                {heroTitle}
              </h1>
              <p className="mt-4 text-xl leading-8 text-white/85 sm:text-2xl">
                {heroSubtitle}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#about"
                  className="inline-flex items-center justify-center rounded-full bg-[#D4AF37] px-6 py-3 text-base font-semibold text-[#0B1F3A] transition hover:bg-[#e0bf4a]"
                >
                  Learn More
                </a>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-6 backdrop-blur">
              {bannerUrl && (
                <Image
                  src={bannerUrl}
                  alt="Latest banner"
                  width={1200}
                  height={528}
                  unoptimized
                  className="mb-4 h-44 w-full rounded-xl object-cover"
                />
              )}
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
                Our calling
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">
                {heroCalloutTitle}
              </h2>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-white/80 sm:text-base">
                {heroCalloutItems.map((item: string) => <li key={item}>• {item}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-[#D4AF37]/30 bg-[#0B1F3A] px-6 py-5 text-center text-white shadow-sm sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#D4AF37]">
            Scripture
          </p>
          <p className="mt-2 text-lg font-semibold sm:text-2xl">
            {scripture}
          </p>
        </section>

        <section id="about" className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[1.75rem] border border-[#D4AF37]/25 bg-white/90 p-8 shadow-[0_20px_70px_-30px_rgba(11,31,58,0.25)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
              About
            </p>
            <h2 className="mt-3 text-3xl font-bold text-[#0B1F3A] sm:text-4xl">
              A ministry rooted in grace, truth, and transformation.
            </h2>
            <p className="mt-4 text-lg leading-8 text-[#0B1F3A]/80">
              {aboutBody || 'Crowned Victors Ministry exists to help believers discover their identity in Christ, grow in spiritual maturity, and live with courage, compassion, and kingdom clarity.'}
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-[#D4AF37]/20 bg-[#0B1F3A] p-8 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
              Why We Serve
            </p>
            <div className="mt-4 space-y-4 text-base leading-8 text-white/80">
              {aboutWhy.map((p: string, i: number) => <p key={i}>{p}</p>)}
            </div>
          </div>
        </section>

        <section id="vision" className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[1.75rem] border border-[#D4AF37]/25 bg-[#fffdf8] p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">Vision</p>
            <h3 className="mt-3 text-2xl font-semibold text-[#0B1F3A]">
              {visionTitle}
            </h3>
            <p className="mt-4 text-lg leading-8 text-[#0B1F3A]/75">
              {visionText}
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-[#D4AF37]/25 bg-white/90 p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">Mission</p>
            <h3 className="mt-3 text-2xl font-semibold text-[#0B1F3A]">
              {missionTitle}
            </h3>
            <p className="mt-4 text-lg leading-8 text-[#0B1F3A]/75">
              {missionText}
            </p>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-[#D4AF37]/25 bg-white/90 p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
            Statement of Faith
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {faithPoints.map((point) => (
              <div key={point} className="rounded-2xl border border-[#D4AF37]/20 bg-[#fffdf8] p-4 text-[#0B1F3A]/80">
                {point}
              </div>
            ))}
          </div>
        </section>

        <section id="ministries" className="rounded-[1.75rem] border border-[#D4AF37]/25 bg-[#0B1F3A] p-8 text-white shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">Ministries</p>
              <h3 className="mt-2 text-3xl font-semibold">Cultivating spiritual growth and kingdom impact.</h3>
            </div>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {ministries.map((ministry) => (
              <div key={ministry.title} className="rounded-[1.25rem] border border-white/10 bg-white/10 p-6">
                <h4 className="text-xl font-semibold text-white">{ministry.title}</h4>
                <p className="mt-3 text-base leading-8 text-white/75">{ministry.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="events" className="rounded-[1.75rem] border border-[#D4AF37]/25 bg-white/90 p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">Events</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {events.map((event) => (
              <div key={event.title} className="rounded-[1.25rem] border border-[#D4AF37]/20 bg-[#fffdf8] p-5">
                <h4 className="text-xl font-semibold text-[#0B1F3A]">{event.title}</h4>
                <p className="mt-2 text-base leading-7 text-[#0B1F3A]/75">{event.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="gallery" className="rounded-[1.75rem] border border-[#D4AF37]/25 bg-white/90 p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">Gallery</p>
          <h3 className="mt-2 text-3xl font-semibold text-[#0B1F3A]">{galleryHeading}</h3>
          <p className="mt-3 text-base leading-7 text-[#0B1F3A]/75">{galleryDescription}</p>

          {galleryImages.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {galleryImages.map((url, index) => (
                <div key={`${url}-${index}`} className="overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-[#fffdf8]">
                  <Image src={url} alt={`Gallery photo ${index + 1}`} width={1200} height={672} unoptimized className="h-56 w-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-[#D4AF37]/40 bg-[#fffdf8] p-6 text-base text-[#0B1F3A]/70">
              Gallery photos will appear here once uploaded from the admin portal.
            </div>
          )}
        </section>

        <BooksSection books={books} heading={booksSectionHeading} description={booksSectionDescription} />

        <section id="contact" className="rounded-[1.75rem] border border-[#D4AF37]/25 bg-[#0B1F3A] p-8 text-white shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">Contact</p>
              <h3 className="mt-3 text-3xl font-semibold">Let’s connect and grow together.</h3>
              <p className="mt-4 text-lg leading-8 text-white/80">
                Whether you are seeking prayer, partnership, or a deeper walk with God, we would love to hear from you.
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-white/10 bg-white/10 p-6 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">Reach us</p>
              <div className="mt-4 space-y-3 text-base text-white/85">
                <p>Email: <a href={`mailto:${contactEmail}`} className="text-[#D4AF37] hover:underline">{contactEmail}</a></p>
                <p>Phone: <a href={`tel:${contactPhone.replace(/\D/g,'')}`} className="text-[#D4AF37] hover:underline">{contactPhone}</a></p>
                <p>Location: {contactLocation}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#D4AF37]/20 bg-white/70 py-6 text-center text-sm text-[#0B1F3A]/70">
        © 2026 Crowned Victors Ministry. All rights reserved.
      </footer>
    </div>
  );
}
