import type { Notice } from '../../shared/types/notice.ts'
import type { ShirtSize, ShopItem } from '../shop/shopTypes.ts'

export type CartItem = {
  productId: string
  quantity: number
  size: ShirtSize
}

export type CartLineItem = {
  lineId: string
  product: ShopItem
  quantity: number
  size: ShirtSize
  subtotal: number
}

export type CartState = {
  items: CartItem[]
  notice: Notice | null
}
