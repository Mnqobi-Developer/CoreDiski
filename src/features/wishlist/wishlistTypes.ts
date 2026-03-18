import type { Notice } from '../../shared/types/notice.ts'
import type { ShirtSize, ShopItem } from '../shop/shopTypes.ts'

export type WishlistItem = {
  productId: string
  size: ShirtSize
}

export type WishlistLineItem = {
  lineId: string
  product: ShopItem
  size: ShirtSize
}

export type WishlistState = {
  items: WishlistItem[]
  notice: Notice | null
}
