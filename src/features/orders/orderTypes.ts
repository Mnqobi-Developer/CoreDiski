import type { CartLineItem } from '../cart/cartTypes.ts'

export type OrderStatus = 'pending' | 'shipped' | 'completed'
export type PaymentStatus = 'awaiting_approval' | 'paid'

export type OrderRecord = {
  createdAt: string
  email: string
  id: string
  items: CartLineItem[]
  paymentStatus: PaymentStatus
  shippingAddress: string
  status: OrderStatus
  total: number
  userId: string
}

export type OrderSummary = {
  completed: number
  pending: number
  shipped: number
}
