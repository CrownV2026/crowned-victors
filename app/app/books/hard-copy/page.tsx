'use client'

import Link from 'next/link'
import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { BookItem, getBookCurrency, getBookPrice, normalizeBook } from '../../../lib/bookPurchase'

type ContentResponse = {
  books?: BookItem[]
}

type DeliveryFormState = {
  fullName: string
  phone: string
  email: string
  quantity: string
  address: string
  cityTown: string
  country: string
  additionalInstructions: string
}

const EMPTY_FORM: DeliveryFormState = {
  fullName: '',
  phone: '',
  email: '',
  quantity: '1',
  address: '',
  cityTown: '',
  country: '',
  additionalInstructions: '',
}

function HardCopyOrderPageContent() {
  const params = useSearchParams()
  const [books, setBooks] = useState<BookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<DeliveryFormState>(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const selectedBookId = params.get('bookId') || ''

  useEffect(() => {
    let cancelled = false

    fetch('/api/books')
      .then(async (response) => {
        if (!response.ok) return null
        const data = (await response.json()) as ContentResponse | null
        return data
      })
      .then((data) => {
        if (cancelled) return
        const nextBooks = Array.isArray(data?.books) ? data.books.map((book) => normalizeBook(book)) : []
        setBooks(nextBooks)
      })
      .catch(() => {
        if (!cancelled) setBooks([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const selectedBook = useMemo(() => {
    if (!selectedBookId) return null

    const byId = books.find((book) => book.id === selectedBookId)
    if (byId) return byId

    const legacyIndex = Number(selectedBookId)
    if (Number.isInteger(legacyIndex) && legacyIndex >= 0) return books[legacyIndex] || null
    return null
  }, [books, selectedBookId])

  const setField = (key: keyof DeliveryFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')

    if (!selectedBook?.id) {
      setErrorMessage('This book cannot be ordered right now.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/book-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: selectedBook.id,
          customerName: form.fullName,
          phone: form.phone,
          email: form.email,
          quantity: Number(form.quantity),
          deliveryAddress: form.address,
          cityTown: form.cityTown,
          country: form.country,
          additionalInstructions: form.additionalInstructions,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: 'Unable to submit order.' }))
        throw new Error(payload?.error || 'Unable to submit order.')
      }

      setSubmitted(true)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to submit order.'
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-base text-[#0B1F3A]/80">Loading order form...</p>
      </main>
    )
  }

  if (!selectedBook) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#D4AF37]/25 bg-[#fffdf8] p-8">
          <h1 className="text-2xl font-semibold text-[#0B1F3A]">Hard copy order form</h1>
          <p className="mt-4 text-[#0B1F3A]/75">The selected book could not be found.</p>
          <Link href="/#store" className="mt-6 inline-flex rounded-full bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#17345f]">
            Back to book store
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-[#D4AF37]/25 bg-[#fffdf8] p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">Hard copy purchase</p>
        <h1 className="mt-3 text-3xl font-bold text-[#0B1F3A]">{selectedBook.title}</h1>
        <p className="mt-2 text-sm font-medium uppercase tracking-[0.2em] text-[#0B1F3A]/65">
          {selectedBook.author ? `By ${selectedBook.author}` : 'Book Order'}
        </p>
        <p className="mt-2 text-base font-semibold text-[#0B1F3A]">
          {getBookCurrency(selectedBook)} {getBookPrice(selectedBook).toFixed(2)}
        </p>
        <p className="mt-3 text-base leading-7 text-[#0B1F3A]/75">
          Fill in your delivery details and submit your hard-copy request.
        </p>

        {selectedBook.deliveryInstructions ? (
          <div className="mt-4 rounded-xl border border-[#D4AF37]/25 bg-white p-4 text-sm leading-7 text-[#0B1F3A]/75">
            {selectedBook.deliveryInstructions}
          </div>
        ) : null}

        {selectedBook.deliveryContactLink ? (
          <a
            href={selectedBook.deliveryContactLink}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex rounded-full border border-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#0B1F3A] hover:bg-[#f7efd4]"
          >
            Delivery/contact link
          </a>
        ) : null}

        {!submitted ? (
          <form onSubmit={submitOrder} className="mt-6 grid gap-4">
            <input
              required
              value={form.fullName}
              onChange={(event) => setField('fullName', event.target.value)}
              placeholder="Full name"
              className="rounded-lg border border-[#D4AF37]/40 px-3 py-2"
            />
            <input
              required
              value={form.phone}
              onChange={(event) => setField('phone', event.target.value)}
              placeholder="Phone number"
              className="rounded-lg border border-[#D4AF37]/40 px-3 py-2"
            />
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setField('email', event.target.value)}
              placeholder="Email"
              className="rounded-lg border border-[#D4AF37]/40 px-3 py-2"
            />
            <input
              required
              type="number"
              min="1"
              value={form.quantity}
              onChange={(event) => setField('quantity', event.target.value)}
              placeholder="Quantity"
              className="rounded-lg border border-[#D4AF37]/40 px-3 py-2"
            />
            <textarea
              required
              value={form.address}
              onChange={(event) => setField('address', event.target.value)}
              placeholder="Street address"
              className="min-h-24 rounded-lg border border-[#D4AF37]/40 px-3 py-2"
            />
            <input
              required
              value={form.cityTown}
              onChange={(event) => setField('cityTown', event.target.value)}
              placeholder="City/town"
              className="rounded-lg border border-[#D4AF37]/40 px-3 py-2"
            />
            <input
              required
              value={form.country}
              onChange={(event) => setField('country', event.target.value)}
              placeholder="Country"
              className="rounded-lg border border-[#D4AF37]/40 px-3 py-2"
            />
            <textarea
              value={form.additionalInstructions}
              onChange={(event) => setField('additionalInstructions', event.target.value)}
              placeholder="Additional delivery instructions (optional)"
              className="min-h-24 rounded-lg border border-[#D4AF37]/40 px-3 py-2"
            />

            <div className="mt-2 flex flex-wrap gap-3">
              <button
                disabled={isSubmitting}
                type="submit"
                className="rounded-full bg-[#0B1F3A] px-5 py-2 text-sm font-semibold text-white hover:bg-[#17345f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Submitting...' : 'Submit order'}
              </button>
              <Link href="/#store" className="inline-flex items-center rounded-full border border-[#D4AF37] px-5 py-2 text-sm font-semibold text-[#0B1F3A] hover:bg-[#f7efd4]">
                Back to book store
              </Link>
            </div>
            {errorMessage ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
            ) : null}
          </form>
        ) : (
          <div className="mt-6 rounded-xl border border-[#D4AF37]/25 bg-white p-4">
            <p className="text-lg font-semibold text-[#0B1F3A]">Order received</p>
            <p className="mt-2 text-sm leading-7 text-[#0B1F3A]/75">
              Thank you. Your hard-copy request has been received and will be processed by the admin team.
            </p>
            <div className="mt-4">
              <Link href="/#store" className="text-sm font-semibold text-[#0B1F3A] underline-offset-4 hover:underline">
                Back to book store
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default function HardCopyOrderPage() {
  return (
    <Suspense fallback={(
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-base text-[#0B1F3A]/80">Loading order form...</p>
      </main>
    )}>
      <HardCopyOrderPageContent />
    </Suspense>
  )
}
