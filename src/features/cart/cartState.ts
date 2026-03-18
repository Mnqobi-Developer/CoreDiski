import { readCartItems } from './cartStorage.ts'
import type { CartState } from './cartTypes.ts'

export const createInitialCartState = (): CartState => ({
  items: readCartItems(),
  notice: null,
})
