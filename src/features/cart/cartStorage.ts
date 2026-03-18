import { shopCatalog } from '../shop/shopCatalog.ts'
import type { ShirtSize } from '../shop/shopTypes.ts'
import type { CartItem } from './cartTypes.ts'

const cartStorageKey = 'core-diski-cart'

const isValidCartItem = (value: unknown): value is CartItem => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<CartItem>

  if (typeof candidate.productId !== 'string' || typeof candidate.quantity !== 'number') {
    return false
  }

  if (!Number.isInteger(candidate.quantity) || candidate.quantity < 1) {
    return false
  }

  if (typeof candidate.size !== 'string') {
    return false
  }

  const product = shopCatalog.find((item) => item.id === candidate.productId)

  return Boolean(product?.availableSizes.includes(candidate.size as ShirtSize))
}

export const readCartItems = (): CartItem[] => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const rawValue = window.localStorage.getItem(cartStorageKey)

    if (!rawValue) {
      return []
    }

    const parsedValue = JSON.parse(rawValue)

    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue.filter(isValidCartItem)
  } catch {
    return []
  }
}

export const writeCartItems = (items: CartItem[]) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(cartStorageKey, JSON.stringify(items))
}
