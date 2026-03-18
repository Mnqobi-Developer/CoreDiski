import type { OrderRecord } from './orderTypes.ts'

const ordersStorageKey = 'core-diski-orders'

const isValidOrder = (value: unknown): value is OrderRecord => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<OrderRecord>

    return (
      typeof candidate.id === 'string' &&
      typeof candidate.userId === 'string' &&
      typeof candidate.email === 'string' &&
      typeof candidate.createdAt === 'string' &&
      (candidate.paymentStatus === 'awaiting_approval' || candidate.paymentStatus === 'paid') &&
      typeof candidate.shippingAddress === 'string' &&
      typeof candidate.total === 'number' &&
      Array.isArray(candidate.items) &&
    (candidate.status === 'pending' ||
      candidate.status === 'shipped' ||
      candidate.status === 'completed')
  )
}

export const readOrders = (): OrderRecord[] => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const rawValue = window.localStorage.getItem(ordersStorageKey)

    if (!rawValue) {
      return []
    }

    const parsedValue = JSON.parse(rawValue)

    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue.filter(isValidOrder)
  } catch {
    return []
  }
}

export const writeOrders = (orders: OrderRecord[]) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(ordersStorageKey, JSON.stringify(orders))
}
