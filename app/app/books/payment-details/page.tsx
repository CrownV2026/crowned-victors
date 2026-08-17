'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { BookItem, getBookCurrency, getBookPaymentUrl, getBookPrice, isBookPurchased, markBookPurchased, normalizeBook } from '../../../lib/bookPurchase'

type ContentResponse = {
  books?: BookItem[]
}

function getPaymentUrlWithMethod(url: string, method: 'mobile_money' | 'visa') {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (trimmed.includes('{method}')) {
    return trimmed.replaceAll('{method}', method)
  }

  try {
    const next = new URL(trimmed)
    next.searchParams.set('method', method)
    return next.toString()
  } catch {
    return trimmed
  }
}

function PaymentDetailsPageContent() {
  const params = useSearchParams()
  const [books, setBooks] = useState<BookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmedBySession, setConfirmedBySession] = useState<Record<string, boolean>>({})
  const [paymentReference, setPaymentReference] = useState('')
  const [paymentError, setPaymentError] = useState('')

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

  const selectedBookIndex = useMemo(() => {
    if (!selectedBook) return -1
    const byIdIndex = selectedBook.id ? books.findIndex((book) => book.id === selectedBook.id) : -1
    if (byIdIndex >= 0) return byIdIndex
    const legacyIndex = Number(selectedBookId)
    if (Number.isInteger(legacyIndex) && legacyIndex >= 0) return legacyIndex
    return -1
  }, [books, selectedBook, selectedBookId])

  const bookPrice = selectedBook ? getBookPrice(selectedBook) : 0
  const displayCurrency = selectedBook ? getBookCurrency(selectedBook) : 'USD'
  const paymentUrl = selectedBook ? getBookPaymentUrl(selectedBook) : ''
  const mobileMoneyPaymentUrl = getPaymentUrlWithMethod(paymentUrl, 'mobile_money')
  const visaPaymentUrl = getPaymentUrlWithMethod(paymentUrl, 'visa')
  const paymentStorageKey = selectedBook && selectedBookIndex >= 0
    ? `${selectedBookIndex}:${selectedBook.title.trim().toLowerCase()}`
    : ''

  const hasConfirmedPayment = useMemo(() => {
    if (!selectedBook || selectedBookIndex < 0 || !paymentStorageKey) return false
    return Boolean(confirmedBySession[paymentStorageKey]) || isBookPurchased(selectedBookIndex, selectedBook.title)
  }, [confirmedBySession, paymentStorageKey, selectedBook, selectedBookIndex])

  const handleConfirmPayment = () => {
    if (!selectedBook || selectedBookIndex < 0 || !paymentStorageKey) return
    if (!paymentReference.trim()) {
      setPaymentError('Enter your payment reference after completing full payment.')
      return
    }
    markBookPurchased(selectedBookIndex, selectedBook.title)
    setConfirmedBySession((prev) => ({ ...prev, [paymentStorageKey]: true }))
    setPaymentError('')
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-base text-[#0B1F3A]/80">Loading payment details...</p>
      </main>
    )
  }

  if (!selectedBook) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#D4AF37]/25 bg-[#fffdf8] p-8">
          <h1 className="text-2xl font-semibold text-[#0B1F3A]">Payment details</h1>
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
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">Book payment</p>
        <h1 className="mt-3 text-3xl font-bold text-[#0B1F3A]">{selectedBook.title}</h1>
        <p className="mt-2 text-sm font-medium uppercase tracking-[0.2em] text-[#0B1F3A]/65">
          {selectedBook.author ? `By ${selectedBook.author}` : 'Digital Purchase'}
        </p>
        <p className="mt-3 text-base leading-7 text-[#0B1F3A]/75">{selectedBook.fullDescription || selectedBook.description}</p>

        <div className="mt-6 rounded-2xl border border-[#D4AF37]/20 bg-white p-4">
          <p className="text-sm text-[#0B1F3A]/80">Online purchase price</p>
          <p className="mt-1 text-xl font-semibold text-[#0B1F3A]">{displayCurrency} {bookPrice > 0 ? bookPrice.toFixed(2) : 'Not set'}</p>
        </div>

        {selectedBook.paymentProviderName && (
          <p className="mt-4 text-sm font-semibold text-[#0B1F3A]">
            Payment provider: <span className="text-[#0B1F3A]/75">{selectedBook.paymentProviderName}</span>
          </p>
        )}

        {selectedBook.paymentInstructions && (
          <div className="mt-4 rounded-xl border border-[#D4AF37]/20 bg-white p-4 text-sm leading-7 text-[#0B1F3A]/80">
            {selectedBook.paymentInstructions}
          </div>
        )}

        {paymentUrl ? (
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={mobileMoneyPaymentUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full bg-[#D4AF37] px-5 py-2 text-sm font-semibold text-[#0B1F3A] hover:bg-[#e0bf4a]"
            >
              Buy Online (Mobile Money)
            </a>
            <a
              href={visaPaymentUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full bg-[#0B1F3A] px-5 py-2 text-sm font-semibold text-white hover:bg-[#17345f]"
            >
              Buy Online (Visa)
            </a>
          </div>
        ) : (
          <p className="mt-5 text-sm text-[#0B1F3A]/70">No payment link has been configured yet.</p>
        )}

        {selectedBook.downloadUrl && (
          <div className="mt-6 rounded-2xl border border-[#D4AF37]/20 bg-white p-4">
            <p className="text-sm font-semibold text-[#0B1F3A]">Digital download access</p>
            {hasConfirmedPayment ? (
              <a
                href={selectedBook.downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex rounded-full bg-[#0B1F3A] px-5 py-2 text-sm font-semibold text-white hover:bg-[#17345f]"
              >
                Download Book
              </a>
            ) : (
              <>
                <p className="mt-2 text-sm text-[#0B1F3A]/75">
                  Download unlocks only after full payment. Complete payment via Mobile Money or Visa, then enter your payment reference.
                </p>
                <input
                  value={paymentReference}
                  onChange={(event) => setPaymentReference(event.target.value)}
                  placeholder="Payment reference / transaction ID"
                  className="mt-3 w-full rounded-xl border border-[#D4AF37]/30 px-3 py-2 text-sm text-[#0B1F3A] outline-none focus:border-[#D4AF37]"
                />
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  className="mt-3 inline-flex rounded-full border border-[#D4AF37] px-5 py-2 text-sm font-semibold text-[#0B1F3A] hover:bg-[#f7efd4]"
                >
                  I have completed full payment
                </button>
                {paymentError && <p className="mt-2 text-sm text-[#B42318]">{paymentError}</p>}
              </>
            )}
          </div>
        )}

        <div className="mt-6">
          <Link href="/#store" className="rounded-full border border-[#D4AF37] px-5 py-2 text-sm font-semibold text-[#0B1F3A] hover:bg-[#f7efd4]">
            Back to book store
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function PaymentDetailsPage() {
  return (
    <Suspense fallback={(
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-base text-[#0B1F3A]/80">Loading payment details...</p>
      </main>
    )}>
      <PaymentDetailsPageContent />
    </Suspense>
  )
}
