import { shopCatalog } from '../shop/shopCatalog.ts'
import type { WishlistItem, WishlistLineItem } from './wishlistTypes.ts'

export const getWishlistLineItems = (items: WishlistItem[]): WishlistLineItem[] =>
  items.flatMap((item) => {
    const product = shopCatalog.find((catalogItem) => catalogItem.id === item.productId)

    if (!product) {
      return []
    }

    return [
      {
        lineId: `${item.productId}:${item.size}`,
        product,
        size: item.size,
      },
    ]
  })
