import { shopCatalog } from '../shop/shopCatalog.ts'
import type { CartItem, CartLineItem } from './cartTypes.ts'

export const getCartLineItems = (items: CartItem[]): CartLineItem[] =>
  items.flatMap((item) => {
    const product = shopCatalog.find((catalogItem) => catalogItem.id === item.productId)

    if (!product) {
      return []
    }

    return [
      {
        lineId: `${item.productId}:${item.size}`,
        product,
        quantity: item.quantity,
        size: item.size,
        subtotal: product.price * item.quantity,
      },
    ]
  })

export const getCartSubtotal = (items: CartItem[]) =>
  getCartLineItems(items).reduce((total, item) => total + item.subtotal, 0)

export const getCartItemCount = (items: CartItem[]) =>
  items.reduce((count, item) => count + item.quantity, 0)
