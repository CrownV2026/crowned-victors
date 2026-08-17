'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { BookItem, getBookCurrency, getBookPaymentUrl, getBookPrice, normalizeBook } from '../../../lib/bookPurchase'

type ContentResponse = {
  books?: BookItem[]
}

function getPaymentUrlWithMethod(url: string, method: 'mobile_money' | 'visa') {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (trimmed.includes('{method}')) {
    return trimmed.replaceAll('{method}', method)
  }

  const joiner = trimmed.includes('?') ? '&' : '?'
  return `${trimmed}${joiner}method=${method}`
}

function PaymentDetailsPageContent() {
  const params = useSearchParams()
  const [books, setBooks] = useState<BookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadUrl, setDownloadUrl] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'mobile_money' | 'visa'>('mobile_money')
  const [unlockingDownload, setUnlockingDownload] = useState(false)
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

  const bookPrice = selectedBook ? getBookPrice(selectedBook) : 0
  const displayCurrency = selectedBook ? getBookCurrency(selectedBook) : 'USD'
  const paymentUrl = selectedBook ? getBookPaymentUrl(selectedBook) : ''
  const mobileMoneyPaymentUrl = getPaymentUrlWithMethod(paymentUrl, 'mobile_money')
  const visaPaymentUrl = getPaymentUrlWithMethod(paymentUrl, 'visa')

  const handleUnlockDownload = async () => {
    if (!selectedBook?.id) {
      setPaymentError('This book cannot be unlocked yet. Please contact support.')
      return
    }
    if (!paymentReference.trim()) {
      setPaymentError('Enter your payment reference after completing full payment.')
      return
    }
    setUnlockingDownload(true)
    setPaymentError('')

    try {
      const response = await fetch('/api/books/download-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: selectedBook.id,
          paymentMethod: selectedPaymentMethod,
          paymentReference: paymentReference.trim(),
        }),
      })

      const payload = await response.json().catch(() => ({ error: 'Unable to unlock download.' })) as { downloadUrl?: string; error?: string }
      if (!response.ok || !payload.downloadUrl) {
        setPaymentError(payload.error || 'Payment could not be verified yet. Please try again.')
        return
      }

      setDownloadUrl(payload.downloadUrl)
    } catch {
      setPaymentError('Unable to verify payment right now. Please try again shortly.')
    } finally {
      setUnlockingDownload(false)
    }
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

        {(selectedBook.hasDownloadUrl || selectedBook.downloadUrl) && (
          <div className="mt-6 rounded-2xl border border-[#D4AF37]/20 bg-white p-4">
            <p className="text-sm font-semibold text-[#0B1F3A]">Digital download access</p>
            {downloadUrl ? (
              <a
                href={downloadUrl}
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
                <label className="mt-3 block text-sm text-[#0B1F3A]/80">
                  Payment method used
                  <select
                    value={selectedPaymentMethod}
                    onChange={(event) => setSelectedPaymentMethod(event.target.value === 'visa' ? 'visa' : 'mobile_money')}
                    className="mt-1 w-full rounded-xl border border-[#D4AF37]/30 px-3 py-2 text-sm text-[#0B1F3A] outline-none focus:border-[#D4AF37]"
                  >
                    <option value="mobile_money">Mobile Money</option>
                    <option value="visa">Visa</option>
                  </select>
                </label>
                <p className="mt-2 text-xs text-[#0B1F3A]/65">
                  Verification checks your {selectedPaymentMethod === 'visa' ? 'Visa' : 'Mobile Money'} payment before unlocking the file.
                </p>
                <button
                  type="button"
                  onClick={handleUnlockDownload}
                  disabled={unlockingDownload}
                  className="mt-3 inline-flex rounded-full border border-[#D4AF37] px-5 py-2 text-sm font-semibold text-[#0B1F3A] hover:bg-[#f7efd4]"
                >
                  {unlockingDownload ? 'Verifying payment...' : 'Verify payment & unlock download'}
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
