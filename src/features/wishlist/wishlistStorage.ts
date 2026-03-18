import { shopCatalog } from '../shop/shopCatalog.ts'
import type { ShirtSize } from '../shop/shopTypes.ts'
import type { WishlistItem } from './wishlistTypes.ts'

const wishlistStorageKey = 'core-diski-wishlist'

const isValidWishlistItem = (value: unknown): value is WishlistItem => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<WishlistItem>

  if (typeof candidate.productId !== 'string' || typeof candidate.size !== 'string') {
    return false
  }

  const product = shopCatalog.find((item) => item.id === candidate.productId)

  return Boolean(product?.availableSizes.includes(candidate.size as ShirtSize))
}

export const readWishlistItems = (): WishlistItem[] => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const rawValue = window.localStorage.getItem(wishlistStorageKey)

    if (!rawValue) {
      return []
    }

    const parsedValue = JSON.parse(rawValue)

    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue.filter(isValidWishlistItem)
  } catch {
    return []
  }
}

export const writeWishlistItems = (items: WishlistItem[]) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(wishlistStorageKey, JSON.stringify(items))
}
