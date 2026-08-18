export type BookItem = {
  id?: string
  title: string
  author?: string
  coverImageUrl?: string
  description: string
  fullDescription?: string
  status?: string
  price?: number | string
  currency?: string
  isbn?: string
  publishedDate?: string
  isPublished?: boolean
  onlinePurchaseEnabled?: boolean
  hardCopyEnabled?: boolean
  paymentProviderName?: string
  paymentUrl?: string
  paymentInstructions?: string
  hasDownloadUrl?: boolean
  deliveryContactLink?: string
  deliveryInstructions?: string
  sortOrder?: number

  // Legacy metadata keys kept for compatibility with existing content JSON.
  buyUrl?: string
  downloadUrl?: string
  orderUrl?: string
  buyLabel?: string
  downloadLabel?: string
  orderLabel?: string
  softCopyPrice?: number | string
  cost?: number | string
}

const PURCHASE_STORAGE_KEY = 'crowned-victors-book-purchases'

export function getBookKey(index: number, title: string) {
  return `${index}:${title.trim().toLowerCase()}`
}

export function isBookPurchased(index: number, title: string) {
  if (typeof window === 'undefined') return false

  try {
    const raw = localStorage.getItem(PURCHASE_STORAGE_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw) as Record<string, boolean>
    return Boolean(parsed[getBookKey(index, title)])
  } catch {
    return false
  }
}

export function markBookPurchased(index: number, title: string) {
  if (typeof window === 'undefined') return

  try {
    const raw = localStorage.getItem(PURCHASE_STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Record<string, boolean>) : {}
    parsed[getBookKey(index, title)] = true
    localStorage.setItem(PURCHASE_STORAGE_KEY, JSON.stringify(parsed))
  } catch {
    // Ignore local storage failures to avoid breaking the payment flow.
  }
}

export function getBookPrice(book: BookItem) {
  const fromPrice = typeof book.price === 'number' ? book.price : Number(book.price)
  if (Number.isFinite(fromPrice) && fromPrice > 0) return fromPrice

  const fromSoftCopy = typeof book.softCopyPrice === 'number' ? book.softCopyPrice : Number(book.softCopyPrice)
  if (Number.isFinite(fromSoftCopy) && fromSoftCopy > 0) return fromSoftCopy

  const fromCost = typeof book.cost === 'number' ? book.cost : Number(book.cost)
  if (Number.isFinite(fromCost) && fromCost > 0) return fromCost

  return 0
}

export function getBookCurrency(book: BookItem) {
  return typeof book.currency === 'string' && book.currency.trim() ? book.currency.trim().toUpperCase() : 'USD'
}

export function getBookPaymentUrl(book: BookItem) {
  return (book.paymentUrl || book.buyUrl || '').trim()
}

export function isPublishedBook(book: BookItem) {
  if (typeof book.isPublished === 'boolean') return book.isPublished
  const status = (book.status || '').toLowerCase()
  if (!status) return true
  return status !== 'unpublished'
}

export function isComingSoonBook(book: BookItem) {
  return (book.status || '').toLowerCase() === 'coming soon' || (book.status || '').toLowerCase() === 'coming_soon'
}

export function canBuyOnline(book: BookItem) {
  const enabled = typeof book.onlinePurchaseEnabled === 'boolean' ? book.onlinePurchaseEnabled : true
  return enabled && isPublishedBook(book) && !isComingSoonBook(book)
}

export function canBuyHardCopy(book: BookItem) {
  const enabled = typeof book.hardCopyEnabled === 'boolean' ? book.hardCopyEnabled : true
  return enabled && isPublishedBook(book) && !isComingSoonBook(book)
}

export function normalizeBook(raw: Partial<BookItem>): BookItem {
  const status = typeof raw.status === 'string' && raw.status.trim() ? raw.status.trim() : 'Available'
  return {
    id: raw.id,
    title: (raw.title || '').trim(),
    author: (raw.author || '').trim(),
    coverImageUrl: (raw.coverImageUrl || '').trim(),
    description: (raw.description || '').trim(),
    fullDescription: (raw.fullDescription || '').trim(),
    status,
    price: getBookPrice(raw as BookItem),
    currency: getBookCurrency(raw as BookItem),
    isbn: (raw.isbn || '').trim(),
    publishedDate: (raw.publishedDate || '').trim(),
    isPublished: typeof raw.isPublished === 'boolean' ? raw.isPublished : status.toLowerCase() !== 'unpublished',
    onlinePurchaseEnabled: typeof raw.onlinePurchaseEnabled === 'boolean' ? raw.onlinePurchaseEnabled : true,
    hardCopyEnabled: typeof raw.hardCopyEnabled === 'boolean' ? raw.hardCopyEnabled : true,
    paymentProviderName: (raw.paymentProviderName || '').trim(),
    paymentUrl: (raw.paymentUrl || raw.buyUrl || '').trim(),
    paymentInstructions: (raw.paymentInstructions || '').trim(),
    hasDownloadUrl: typeof raw.hasDownloadUrl === 'boolean' ? raw.hasDownloadUrl : Boolean((raw.downloadUrl || '').trim()),
    deliveryContactLink: (raw.deliveryContactLink || raw.orderUrl || '').trim(),
    deliveryInstructions: (raw.deliveryInstructions || '').trim(),
    sortOrder: typeof raw.sortOrder === 'number' ? raw.sortOrder : 0,
    buyUrl: (raw.buyUrl || '').trim(),
    downloadUrl: (raw.downloadUrl || '').trim(),
    orderUrl: (raw.orderUrl || '').trim(),
    buyLabel: raw.buyLabel || 'Buy Online',
    downloadLabel: raw.downloadLabel || 'Download',
    orderLabel: raw.orderLabel || 'Purchase Hard Copy',
    softCopyPrice: raw.softCopyPrice,
    cost: raw.cost,
  }
}
