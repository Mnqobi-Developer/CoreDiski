import { readWishlistItems } from './wishlistStorage.ts'
import type { WishlistState } from './wishlistTypes.ts'

export const createInitialWishlistState = (): WishlistState => ({
  items: readWishlistItems(),
  notice: null,
})
