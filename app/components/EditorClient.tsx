"use client"
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import ImageUpload from './ImageUpload'
import VideoUpload from './VideoUpload'
import supabase from '../lib/supabaseClient'
import { BookItem, normalizeBook } from '../lib/bookPurchase'

const DEFAULTS = {
  title: '', subtitle: '', body: '', banner_url: '',
  homeBackgroundImage: '',
  scripture: '',
  heroCalloutTitle: '',
  heroCalloutItems: '',
  aboutWhy: '',
  galleryHeading: '',
  galleryDescription: '',
  visionTitle: '', visionText: '',
  missionTitle: '', missionText: '',
  faithPoints: '',
  ministriesJson: '',
  eventsJson: '',
  booksJson: '',
  booksSectionHeading: '',
  booksSectionDescription: '',
  sermonsHeading: '',
  sermonsDescription: '',
  sermonsJson: '',
  contactEmail: '', contactPhone: '', contactLocation: '',
  giveOnlineHeading: '',
  giveOnlineIntroduction: '',
  giveOnlineButtonText: '',
  giveOnlineButtonUrl: '',
  givingButtonsJson: '',
  bankName: '',
  accountName: '',
  accountNumber: '',
  branch: '',
  swiftCode: '',
  mobileMoneyProvider: '',
  mobileMoneyNumber: '',
  mobileMoneyRegisteredName: '',
  givingInstructions: '',
  thankYouMessage: '',
}

type BookEditorItem = BookItem

type SermonItem = {
  title: string
  speaker: string
  date: string
  description: string
  videoUrl: string
  thumbnailUrl: string
}

const emptyBook = (): BookEditorItem => ({
  title: '',
  author: '',
  coverImageUrl: '',
  description: '',
  fullDescription: '',
  price: 0,
  currency: 'USD',
  status: 'Available',
  isbn: '',
  publishedDate: '',
  isPublished: true,
  onlinePurchaseEnabled: true,
  hardCopyEnabled: true,
  paymentProviderName: '',
  paymentUrl: '',
  paymentInstructions: '',
  downloadUrl: '',
  deliveryContactLink: '',
  deliveryInstructions: '',
  buyLabel: 'Buy Online',
  orderLabel: 'Purchase Hard Copy',
})

function normalizeBooksArray(value: unknown): BookEditorItem[] {
  if (!Array.isArray(value)) return []
  return value.map((book) => normalizeBook(book as Partial<BookItem>))
}

function normalizeImageArray(value: unknown): string[] {
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
  if (!Array.isArray(value)) return []
  return value.filter((url): url is string => typeof url === 'string' && Boolean(url.trim())).map((url) => url.trim())
}

const emptySermon = (): SermonItem => ({
  title: '',
  speaker: '',
  date: '',
  description: '',
  videoUrl: '',
  thumbnailUrl: '',
})

function normalizeSermonsArray(value: unknown): SermonItem[] {
  if (!Array.isArray(value)) return []

  return value.map((item) => {
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
}

function metaToFlat(meta: Record<string, unknown> | null | undefined): Partial<typeof DEFAULTS> {
  if (!meta) return {}

  const asString = (value: unknown) => (typeof value === 'string' ? value : '')
  const asJoinedString = (value: unknown, separator: string) =>
    Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string').join(separator)
      : asString(value)

  return {
    homeBackgroundImage: asString(meta.homeBackgroundImage),
    scripture: asString(meta.scripture),
    heroCalloutTitle: asString(meta.heroCalloutTitle),
    heroCalloutItems: asJoinedString(meta.heroCalloutItems, '\n'),
    aboutWhy: asJoinedString(meta.aboutWhy, '\n\n'),
    galleryHeading: asString(meta.galleryHeading),
    galleryDescription: asString(meta.galleryDescription),
    visionTitle: asString(meta.visionTitle),
    visionText: asString(meta.visionText),
    missionTitle: asString(meta.missionTitle),
    missionText: asString(meta.missionText),
    faithPoints: asJoinedString(meta.faithPoints, '\n'),
    ministriesJson: meta.ministries ? JSON.stringify(meta.ministries, null, 2) : '',
    eventsJson: meta.events ? JSON.stringify(meta.events, null, 2) : '',
    booksJson: meta.books ? JSON.stringify(meta.books, null, 2) : '',
    booksSectionHeading: asString(meta.booksSectionHeading),
    booksSectionDescription: asString(meta.booksSectionDescription),
    sermonsHeading: asString(meta.sermonsHeading),
    sermonsDescription: asString(meta.sermonsDescription),
    sermonsJson: Array.isArray(meta.sermons) ? JSON.stringify(meta.sermons, null, 2) : '',
    contactEmail: asString(meta.contactEmail),
    contactPhone: asString(meta.contactPhone),
    contactLocation: asString(meta.contactLocation),
    giveOnlineHeading: asString(meta.giveOnlineHeading),
    giveOnlineIntroduction: asString(meta.giveOnlineIntroduction),
    giveOnlineButtonText: asString(meta.giveOnlineButtonText),
    giveOnlineButtonUrl: asString(meta.giveOnlineButtonUrl),
    givingButtonsJson: Array.isArray(meta.givingButtons) ? JSON.stringify(meta.givingButtons, null, 2) : asString(meta.givingButtonsJson),
    bankName: asString(meta.bankName),
    accountName: asString(meta.accountName),
    accountNumber: asString(meta.accountNumber),
    branch: asString(meta.branch),
    swiftCode: asString(meta.swiftCode),
    mobileMoneyProvider: asString(meta.mobileMoneyProvider),
    mobileMoneyNumber: asString(meta.mobileMoneyNumber),
    mobileMoneyRegisteredName: asString(meta.mobileMoneyRegisteredName),
    givingInstructions: asString(meta.givingInstructions),
    thankYouMessage: asString(meta.thankYouMessage),
  }
}

function flatToMeta(f: typeof DEFAULTS, books: BookEditorItem[], galleryImages: string[], sermons: SermonItem[]) {
  function parseJsonSafe(s: string) { try { return JSON.parse(s) } catch { return undefined } }
  return {
    homeBackgroundImage: f.homeBackgroundImage,
    scripture: f.scripture,
    heroCalloutTitle: f.heroCalloutTitle,
    heroCalloutItems: f.heroCalloutItems.split('\n').map(s => s.trim()).filter(Boolean),
    aboutWhy: f.aboutWhy.split('\n\n').map(s => s.trim()).filter(Boolean),
    galleryHeading: f.galleryHeading,
    galleryDescription: f.galleryDescription,
    galleryImages,
    visionTitle: f.visionTitle,
    visionText: f.visionText,
    missionTitle: f.missionTitle,
    missionText: f.missionText,
    faithPoints: f.faithPoints.split('\n').map(s => s.trim()).filter(Boolean),
    ministries: parseJsonSafe(f.ministriesJson),
    events: parseJsonSafe(f.eventsJson),
    books,
    booksSectionHeading: f.booksSectionHeading,
    booksSectionDescription: f.booksSectionDescription,
    sermonsHeading: f.sermonsHeading,
    sermonsDescription: f.sermonsDescription,
    sermons: sermons.length > 0 ? sermons : parseJsonSafe(f.sermonsJson),
    contactEmail: f.contactEmail,
    contactPhone: f.contactPhone,
    contactLocation: f.contactLocation,
    giveOnlineHeading: f.giveOnlineHeading,
    giveOnlineIntroduction: f.giveOnlineIntroduction,
    giveOnlineButtonText: f.giveOnlineButtonText,
    giveOnlineButtonUrl: f.giveOnlineButtonUrl,
    givingButtons: parseJsonSafe(f.givingButtonsJson),
    bankName: f.bankName,
    accountName: f.accountName,
    accountNumber: f.accountNumber,
    branch: f.branch,
    swiftCode: f.swiftCode,
    mobileMoneyProvider: f.mobileMoneyProvider,
    mobileMoneyNumber: f.mobileMoneyNumber,
    mobileMoneyRegisteredName: f.mobileMoneyRegisteredName,
    givingInstructions: f.givingInstructions,
    thankYouMessage: f.thankYouMessage,
  }
}

const fieldStyle = { display: 'block' as const, width: '100%', padding: 8, marginTop: 4, border: '1px solid #ccc' }
const sectionHead = { fontWeight: 700, fontSize: 15, margin: '20px 0 4px', borderBottom: '2px solid #f5d06d', paddingBottom: 4 }

function isMissingTableErrorMessage(value: unknown) {
  const msg = String(value || '').toLowerCase()
  return msg.includes('could not find the table') || (msg.includes('relation') && msg.includes('does not exist'))
}

export default function EditorClient({ slug }: { slug: string }) {
  const [base, setBase] = useState<Record<string, unknown>>({})
  const [f, setF] = useState({ ...DEFAULTS })
  const [books, setBooks] = useState<BookEditorItem[]>([])
  const [sermons, setSermons] = useState<SermonItem[]>([])
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [deletedBookIds, setDeletedBookIds] = useState<string[]>([])

  const set = (key: keyof typeof DEFAULTS) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF(prev => ({ ...prev, [key]: e.target.value }))

  const setBook = (index: number, key: keyof BookEditorItem, value: string | boolean) => {
    setBooks((prev) => prev.map((book, i) => i === index ? { ...book, [key]: value } : book))
  }

  const setSermon = (index: number, key: keyof SermonItem, value: string) => {
    setSermons((prev) => prev.map((sermon, i) => i === index ? { ...sermon, [key]: value } : sermon))
  }

  useEffect(() => {
    fetch(`/api/content?slug=${slug}`)
      .then(async (r) => {
        const data = await r.json().catch(async () => {
          const text = await r.text().catch(() => '')
          return text ? { error: text } : null
        })
        if (!r.ok || !data || data.error) return null
        return data
      })
      .then((data) => {
        if (data) {
          setBase(data)
          const mapped = { ...DEFAULTS, title: data.title || '', subtitle: data.subtitle || '', body: data.body || '', banner_url: data.banner_url || '', ...metaToFlat(data.metadata) }
          setF(mapped)
          setBooks(normalizeBooksArray(data.metadata?.books))
          setSermons(normalizeSermonsArray(data.metadata?.sermons))
          setGalleryImages(normalizeImageArray(data.metadata?.galleryImages || data.metadata?.galleryImagesJson))
        }
      })
      .catch(() => {})
  }, [slug])

  useEffect(() => {
    if (slug !== 'books-and-resources') return

    let cancelled = false

    supabase.auth.getSession().then(async (result) => {
      const token = result.data.session?.access_token
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined
      const adminResponse = await fetch('/api/books?admin=1', { headers })
      const response = adminResponse.ok ? adminResponse : await fetch('/api/books')
      if (!response.ok) return

      const payload = await response.json().catch(() => ({ books: [] }))
      if (!cancelled && Array.isArray(payload.books)) {
        setBooks(normalizeBooksArray(payload.books))
      }
    }).catch(() => {})

    return () => {
      cancelled = true
    }
  }, [slug])

  const save = async () => {
    const session = await supabase.auth.getSession().then(r => r.data.session)
    if (!session) return alert('Sign in first')
    const token = session.access_token

    const metadata = flatToMeta(f, books, galleryImages, sermons)
    const method = base.id ? 'PUT' : 'POST'
    const payload = { id: base.id, title: f.title, subtitle: f.subtitle, body: f.body, banner_url: f.banner_url, page: 'home', slug, metadata }
    const res = await fetch('/api/content', { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) })
    const data = await res.json().catch(async () => {
      const text = await res.text().catch(() => '')
      return text ? { error: text } : {}
    })

    if (!res.ok) {
      alert(data.error || 'Error')
      return
    }

    if (data?.id) {
      setBase(data)
    }

    if (slug === 'books-and-resources') {
      const syncPayload = {
        books: books.map((book, index) => ({
          id: book.id,
          title: book.title,
          author: book.author,
          coverImageUrl: book.coverImageUrl,
          description: book.description,
          fullDescription: book.fullDescription,
          price: book.price,
          currency: book.currency,
          status: book.status,
          isbn: book.isbn,
          publishedDate: book.publishedDate,
          isPublished: book.isPublished,
          onlinePurchaseEnabled: book.onlinePurchaseEnabled,
          hardCopyEnabled: book.hardCopyEnabled,
          paymentProviderName: book.paymentProviderName,
          paymentUrl: book.paymentUrl,
          paymentInstructions: book.paymentInstructions,
          downloadUrl: book.downloadUrl,
          deliveryContactLink: book.deliveryContactLink,
          deliveryInstructions: book.deliveryInstructions,
          sortOrder: index,
          buyLabel: book.buyLabel || 'Buy Online',
          orderLabel: book.orderLabel || 'Purchase Hard Copy',
        })),
      }

      const syncRes = await fetch('/api/books', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(syncPayload),
      })

      if (!syncRes.ok) {
        const err = await syncRes.json().catch(() => ({ error: 'Failed to sync books table' }))
        if (isMissingTableErrorMessage(err.error)) {
          console.warn('Books table sync skipped: table is not available yet. Run supabase/schema.sql or set BOOKS_TABLE.')
        } else {
          alert(err.error || 'Failed to sync books table')
          return
        }
      }

      if (deletedBookIds.length > 0) {
        for (const id of deletedBookIds) {
          await fetch(`/api/books?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          })
        }
        setDeletedBookIds([])
      }
    }

    alert('Saved')
  }

  const addBook = () => {
    setBooks((prev) => [...prev, emptyBook()])
  }

  const removeGalleryImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index))
  }

  const removeBook = (index: number) => {
    setBooks((prev) => {
      const next = [...prev]
      const [removed] = next.splice(index, 1)
      if (removed?.id) setDeletedBookIds((ids) => [...ids, removed.id as string])
      return next
    })
  }

  const addSermon = () => {
    setSermons((prev) => [...prev, emptySermon()])
  }

  const removeSermon = (index: number) => {
    setSermons((prev) => prev.filter((_, i) => i !== index))
  }

  const input = (label: string, key: keyof typeof DEFAULTS, placeholder?: string) => (
    <div style={{ marginBottom: 8 }}>
      <label>{label}</label>
      <input value={f[key]} onChange={set(key)} placeholder={placeholder} style={fieldStyle} />
    </div>
  )

  const textarea = (label: string, key: keyof typeof DEFAULTS, rows = 4, placeholder?: string) => (
    <div style={{ marginBottom: 8 }}>
      <label>{label}</label>
      <textarea value={f[key]} onChange={set(key)} rows={rows} placeholder={placeholder} style={{ ...fieldStyle, resize: 'vertical' }} />
    </div>
  )

  const isGiveOnlineEditor = slug === 'give-online'
  const isGalleryEditor = slug === 'gallery'
  const isSermonsEditor = slug === 'sermons'
  const isHomeEditor = slug === 'home'

  return (
    <div>
      {isGiveOnlineEditor ? (
        <>
          <p style={sectionHead}>Give Online</p>
          {input('Page heading', 'giveOnlineHeading', 'Give Online')}
          {textarea('Introduction / description', 'giveOnlineIntroduction', 3, 'Your generosity helps advance the work of Crowned Victors Ministry.')}
          {input('Button text', 'giveOnlineButtonText', 'Give Online')}
          {input('Button destination URL', 'giveOnlineButtonUrl', '#give-online')}
          {textarea('Giving buttons (JSON array of {label, url})', 'givingButtonsJson', 4, '[{"label":"Give via Mobile Money","url":"#mobile-money"}]')}
          {input('Bank name', 'bankName', 'First Bank')}
          {input('Account name', 'accountName', 'Crowned Victors Ministry')}
          {input('Account number', 'accountNumber', '0000000000')}
          {input('Branch', 'branch', 'Main Branch')}
          {input('SWIFT code', 'swiftCode', 'FBNINGLA')}
          {input('Mobile Money provider', 'mobileMoneyProvider', 'MTN Mobile Money')}
          {input('Mobile Money number', 'mobileMoneyNumber', '+233 000 000 000')}
          {input('Mobile Money registered name', 'mobileMoneyRegisteredName', 'Crowned Victors Ministry')}
          {textarea('Giving instructions', 'givingInstructions', 4, 'Please include your full name and the purpose of your gift.')}
          {textarea('Bible verse / thank-you message', 'thankYouMessage', 3, 'Every act of generosity is a seed of kingdom impact.')}
        </>
      ) : isGalleryEditor ? (
        <>
          <p style={sectionHead}>Gallery</p>
          {input('Gallery heading', 'galleryHeading', 'Gallery')}
          {textarea('Gallery description', 'galleryDescription', 3, 'Moments from worship, fellowship, outreach, and ministry gatherings.')}

          <div style={{ marginBottom: 8 }}>
            <label>Add Gallery Image</label>
            <ImageUpload onUploaded={(url) => setGalleryImages((prev) => [...prev, url])} />
          </div>

          {galleryImages.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 10, marginTop: 10 }}>
              {galleryImages.map((url, index) => (
                <div key={`${url}-${index}`} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 8 }}>
                  <Image src={url} alt={`Gallery ${index + 1}`} width={600} height={240} unoptimized style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6 }} />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    style={{ marginTop: 8, border: '1px solid #dc2626', color: '#dc2626', background: 'transparent', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', width: '100%' }}
                  >
                    Remove image
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: '#6b7280' }}>No images uploaded yet.</p>
          )}
        </>
      ) : isSermonsEditor ? (
        <>
          <p style={sectionHead}>Sermons</p>
          {input('Page heading', 'sermonsHeading', 'Sermons')}
          {textarea('Page description', 'sermonsDescription', 3, 'Watch recent messages and be encouraged in your faith.')}
          {textarea('Sermons JSON backup (optional)', 'sermonsJson', 5, '[{"title":"Sunday Message","videoUrl":"https://..."}]')}

          {sermons.map((sermon, index) => (
            <div key={`${sermon.title || 'sermon'}-${index}`} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <p style={{ fontWeight: 700, marginBottom: 10 }}>Sermon {index + 1}</p>

              <label>Title<input value={sermon.title} onChange={(e) => setSermon(index, 'title', e.target.value)} style={fieldStyle} /></label>
              <label>Speaker<input value={sermon.speaker} onChange={(e) => setSermon(index, 'speaker', e.target.value)} style={fieldStyle} /></label>
              <label>Date<input type="date" value={sermon.date} onChange={(e) => setSermon(index, 'date', e.target.value)} style={fieldStyle} /></label>
              <label>Description<textarea value={sermon.description} onChange={(e) => setSermon(index, 'description', e.target.value)} rows={3} style={{ ...fieldStyle, resize: 'vertical' }} /></label>

              <label>Video URL<input value={sermon.videoUrl} onChange={(e) => setSermon(index, 'videoUrl', e.target.value)} style={fieldStyle} /></label>
              <div style={{ marginTop: 8, marginBottom: 8 }}>
                <label>Upload Video</label>
                <VideoUpload onUploaded={(url) => setSermon(index, 'videoUrl', url)} />
              </div>

              <label>Thumbnail URL (optional)<input value={sermon.thumbnailUrl} onChange={(e) => setSermon(index, 'thumbnailUrl', e.target.value)} style={fieldStyle} /></label>
              <div style={{ marginTop: 8, marginBottom: 8 }}>
                <label>Upload Thumbnail</label>
                <ImageUpload onUploaded={(url) => setSermon(index, 'thumbnailUrl', url)} />
                {sermon.thumbnailUrl ? <Image src={sermon.thumbnailUrl} alt="sermon thumbnail" width={420} height={220} unoptimized style={{ maxWidth: 240, marginTop: 8, height: 'auto', borderRadius: 8 }} /> : null}
              </div>

              {sermon.videoUrl ? (
                <video controls preload="metadata" style={{ width: '100%', maxWidth: 480, marginTop: 8, borderRadius: 8 }} src={sermon.videoUrl} />
              ) : null}

              <button type="button" onClick={() => removeSermon(index)} style={{ marginTop: 10, border: '1px solid #dc2626', color: '#dc2626', background: 'transparent', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>
                Remove sermon
              </button>
            </div>
          ))}

          <button type="button" onClick={addSermon} style={{ border: '1px solid #0b2340', background: '#fff', color: '#0b2340', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>
            Add Sermon
          </button>
        </>
      ) : (
        <>
          <p style={sectionHead}>Hero</p>
          {input('Title (hero heading)', 'title')}
          {input('Subtitle (hero subheading)', 'subtitle')}
          {isHomeEditor ? (
            <>
              {input('Home Background Image URL', 'homeBackgroundImage')}
              <div style={{ marginBottom: 8 }}>
                <label>Home Background Image Upload</label>
                <ImageUpload onUploaded={(url) => setF(prev => ({ ...prev, homeBackgroundImage: url }))} />
                {f.homeBackgroundImage && <Image src={f.homeBackgroundImage} alt="home background" width={640} height={360} unoptimized style={{ maxWidth: 320, marginTop: 8, height: 'auto' }} />}
              </div>
            </>
          ) : null}
          {input('Callout Card Title', 'heroCalloutTitle', 'e.g. Raising a people who live in victory, not fear.')}
          {textarea('Callout Card Bullet Points (one per line)', 'heroCalloutItems', 3, 'e.g. Prayer-centered worship and spiritual renewal')}
          <div style={{ marginBottom: 8 }}>
            <label>Banner Image</label>
            <ImageUpload onUploaded={(url) => setF(prev => ({ ...prev, banner_url: url }))} />
            {f.banner_url && <Image src={f.banner_url} alt="banner" width={640} height={360} unoptimized style={{ maxWidth: 320, marginTop: 8, height: 'auto' }} />}
          </div>

          <p style={sectionHead}>Scripture</p>
          {input('Scripture Verse', 'scripture', '"And I saw, and behold a white horse..." — Revelation 6:2')}

          <p style={sectionHead}>About</p>
          {textarea('About Body', 'body', 4, 'Crowned Victors Ministry exists to help believers...')}
          {textarea('"Why We Serve" Paragraphs (separate with blank line)', 'aboutWhy', 4)}

          <p style={sectionHead}>Vision & Mission</p>
          {input('Vision Title', 'visionTitle')}
          {textarea('Vision Text', 'visionText', 3)}
          {input('Mission Title', 'missionTitle')}
          {textarea('Mission Text', 'missionText', 3)}

          <p style={sectionHead}>Statement of Faith</p>
          {textarea('Faith Points (one per line)', 'faithPoints', 5)}

          <p style={sectionHead}>Ministries</p>
          {textarea('Ministries (JSON array of {title, description})', 'ministriesJson', 6, '[{"title":"Prayer & Intercession","description":"..."}]')}

          <p style={sectionHead}>Events</p>
          {textarea('Events (JSON array of {title, detail})', 'eventsJson', 6, '[{"title":"Midweek Prayer Gathering","detail":"Wednesdays · 7:00 PM"}]')}

          <p style={sectionHead}>Book Store</p>
          {input('Book section heading', 'booksSectionHeading', 'Book Store')}
          {textarea('Book section description', 'booksSectionDescription', 3, 'Buy soft copies online or order hard copies for delivery.')}

          {books.map((book, index) => (
            <div key={`${book.id || 'new'}-${index}`} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <p style={{ fontWeight: 700, marginBottom: 10 }}>Book {index + 1}</p>
              <div style={{ marginBottom: 8 }}>
                <label>Book Cover Image</label>
                <ImageUpload onUploaded={(url) => setBook(index, 'coverImageUrl', url)} />
                {book.coverImageUrl ? <Image src={book.coverImageUrl} alt="book cover" width={360} height={540} unoptimized style={{ maxWidth: 180, marginTop: 8, borderRadius: 6, height: 'auto' }} /> : null}
              </div>
              <label>Book title<input value={book.title || ''} onChange={(e) => setBook(index, 'title', e.target.value)} style={fieldStyle} /></label>
              <label>Author<input value={book.author || ''} onChange={(e) => setBook(index, 'author', e.target.value)} style={fieldStyle} /></label>
              <label>Short description<textarea value={book.description || ''} onChange={(e) => setBook(index, 'description', e.target.value)} rows={2} style={{ ...fieldStyle, resize: 'vertical' }} /></label>
              <label>Full description<textarea value={book.fullDescription || ''} onChange={(e) => setBook(index, 'fullDescription', e.target.value)} rows={4} style={{ ...fieldStyle, resize: 'vertical' }} /></label>
              <label>Price<input type="number" min="0" step="0.01" value={typeof book.price === 'number' ? String(book.price) : book.price || ''} onChange={(e) => setBook(index, 'price', e.target.value)} style={fieldStyle} /></label>
              <label>Currency<input value={book.currency || 'USD'} onChange={(e) => setBook(index, 'currency', e.target.value)} style={fieldStyle} /></label>
              <label>Availability / status<input value={book.status || ''} onChange={(e) => setBook(index, 'status', e.target.value)} placeholder="Available, Coming Soon, etc." style={fieldStyle} /></label>
              <label>ISBN (optional)<input value={book.isbn || ''} onChange={(e) => setBook(index, 'isbn', e.target.value)} style={fieldStyle} /></label>
              <label>Published date (optional)<input type="date" value={book.publishedDate || ''} onChange={(e) => setBook(index, 'publishedDate', e.target.value)} style={fieldStyle} /></label>

              <label>
                Online payment provider name
                <input
                  list={`payment-provider-options-${index}`}
                  value={book.paymentProviderName || ''}
                  onChange={(e) => setBook(index, 'paymentProviderName', e.target.value)}
                  placeholder="Mobile Money / Visa"
                  style={fieldStyle}
                />
                <datalist id={`payment-provider-options-${index}`}>
                  <option value="Mobile Money / Visa" />
                  <option value="Flutterwave (Mobile Money / Visa)" />
                  <option value="Paystack (Mobile Money / Visa)" />
                  <option value="Stripe (Visa)" />
                </datalist>
              </label>
              <label>Online payment URL<input value={book.paymentUrl || ''} onChange={(e) => setBook(index, 'paymentUrl', e.target.value)} style={fieldStyle} /></label>
              <label>Online payment instructions<textarea value={book.paymentInstructions || ''} onChange={(e) => setBook(index, 'paymentInstructions', e.target.value)} rows={3} style={{ ...fieldStyle, resize: 'vertical' }} /></label>
              <div style={{ marginBottom: 8 }}>
                <label>Upload digital book file (PDF/ePub)</label>
                <ImageUpload accept=".pdf,.epub,.mobi,application/pdf,application/epub+zip" onUploaded={(url) => setBook(index, 'downloadUrl', url)} />
              </div>
              <label>Digital download URL (optional)<input value={book.downloadUrl || ''} onChange={(e) => setBook(index, 'downloadUrl', e.target.value)} style={fieldStyle} /></label>

              <label>Delivery/contact link<input value={book.deliveryContactLink || ''} onChange={(e) => setBook(index, 'deliveryContactLink', e.target.value)} style={fieldStyle} /></label>
              <label>Delivery/order instructions<textarea value={book.deliveryInstructions || ''} onChange={(e) => setBook(index, 'deliveryInstructions', e.target.value)} rows={3} style={{ ...fieldStyle, resize: 'vertical' }} /></label>

              <label>Buy Online button label<input value={book.buyLabel || 'Buy Online'} onChange={(e) => setBook(index, 'buyLabel', e.target.value)} style={fieldStyle} /></label>
              <label>Purchase Hard Copy button label<input value={book.orderLabel || 'Purchase Hard Copy'} onChange={(e) => setBook(index, 'orderLabel', e.target.value)} style={fieldStyle} /></label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <input type="checkbox" checked={Boolean(book.isPublished)} onChange={(e) => setBook(index, 'isPublished', e.target.checked)} />
                Published
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <input type="checkbox" checked={Boolean(book.onlinePurchaseEnabled)} onChange={(e) => setBook(index, 'onlinePurchaseEnabled', e.target.checked)} />
                Available for online purchase
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <input type="checkbox" checked={Boolean(book.hardCopyEnabled)} onChange={(e) => setBook(index, 'hardCopyEnabled', e.target.checked)} />
                Available for hard-copy purchase
              </label>

              <button type="button" onClick={() => removeBook(index)} style={{ marginTop: 10, border: '1px solid #dc2626', color: '#dc2626', background: 'transparent', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>
                Remove book
              </button>
            </div>
          ))}

          <button type="button" onClick={addBook} style={{ border: '1px solid #0b2340', background: '#fff', color: '#0b2340', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>
            Add Book
          </button>

          <p style={sectionHead}>Contact</p>
          {input('Email', 'contactEmail', 'hello@crownedvictorsministry.org')}
          {input('Phone', 'contactPhone', '+1 (234) 567-890')}
          {input('Location', 'contactLocation', 'Serving communities with faith, prayer, and purpose')}
        </>
      )}

      <div style={{ marginTop: 16 }}>
        <button onClick={save} style={{ background: '#f5d06d', border: 'none', padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}>Save All</button>
      </div>
    </div>
  )
}
