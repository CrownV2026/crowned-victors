"use client"

import React, { useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BookItem, canBuyHardCopy, canBuyOnline, getBookCurrency, getBookPrice, normalizeBook } from '../lib/bookPurchase'

type BooksSectionProps = {
  books: BookItem[]
  heading: string
  description: string
}

export default function BooksSection({ books, heading, description }: BooksSectionProps) {
  const normalizedBooks = useMemo(() => (books || []).map((book) => normalizeBook(book)), [books])

  return (
    <section id="store" className="rounded-[1.75rem] border border-[#D4AF37]/25 bg-[#fffdf8] p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">{heading}</p>
      <p className="mt-3 text-lg leading-8 text-[#0B1F3A]/75">{description}</p>
      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {normalizedBooks.map((book, index) => {
          const buyLabel = book.buyLabel || 'Buy Online'
          const orderLabel = book.orderLabel || 'Purchase Hard Copy'
          const displayPrice = getBookPrice(book)
          const currency = getBookCurrency(book)
          const onlineEnabled = canBuyOnline(book)
          const hardCopyEnabled = canBuyHardCopy(book)
          const cardStatus = book.status || (onlineEnabled || hardCopyEnabled ? 'Available' : 'Coming Soon')
          const bookRef = book.id || String(index)

          return (
            <article key={`${book.title}-${bookRef}`} className="flex h-full flex-col rounded-[1.25rem] border border-[#D4AF37]/20 bg-white p-5 shadow-sm">
              <div className="relative mb-4 overflow-hidden rounded-xl border border-[#D4AF37]/20 bg-[#f9f2dd]">
                {book.coverImageUrl ? (
                  <Image src={book.coverImageUrl} alt={`${book.title} cover`} width={800} height={624} unoptimized className="h-52 w-full object-cover" />
                ) : (
                  <div className="flex h-52 items-center justify-center px-4 text-center text-sm font-semibold uppercase tracking-[0.18em] text-[#0B1F3A]/55">
                    Crowned Victors Book
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <h4 className="text-xl font-semibold text-[#0B1F3A]">{book.title}</h4>
                <span className="rounded-full bg-[#D4AF37]/15 px-3 py-1 text-sm font-semibold text-[#0B1F3A]">
                  {cardStatus}
                </span>
              </div>

              <p className="mt-1 text-sm font-medium uppercase tracking-[0.18em] text-[#0B1F3A]/60">
                {book.author ? `By ${book.author}` : 'Author to be announced'}
              </p>
              <p className="mt-3 text-base leading-7 text-[#0B1F3A]/75">{book.description}</p>
              <p className="mt-4 text-lg font-semibold text-[#0B1F3A]">
                {currency} {displayPrice > 0 ? displayPrice.toFixed(2) : '0.00'}
              </p>

              <div className="mt-auto pt-4">
                <div className="grid gap-2">
                  {onlineEnabled ? (
                    <Link
                      href={`/books/payment-details?bookId=${encodeURIComponent(bookRef)}`}
                      className="inline-flex items-center justify-center rounded-full bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#17345f]"
                    >
                      {buyLabel}
                    </Link>
                  ) : (
                    <span className="inline-flex items-center justify-center rounded-full border border-[#0B1F3A]/30 px-4 py-2 text-sm font-semibold text-[#0B1F3A]/60">
                      Online purchase unavailable
                    </span>
                  )}

                  {hardCopyEnabled ? (
                    <Link
                      href={`/books/hard-copy?bookId=${encodeURIComponent(bookRef)}`}
                      className="inline-flex items-center justify-center rounded-full border border-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#0B1F3A] transition hover:bg-[#f7efd4]"
                    >
                      {orderLabel}
                    </Link>
                  ) : (
                    <span className="inline-flex items-center justify-center rounded-full border border-[#D4AF37]/40 px-4 py-2 text-sm font-semibold text-[#0B1F3A]/55">
                      Hard copy unavailable
                    </span>
                  )}
                </div>
              </div>

              {book.isbn && (
                <p className="mt-4 text-xs text-[#0B1F3A]/55">ISBN: {book.isbn}</p>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
