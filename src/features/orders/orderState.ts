import { readOrders } from './orderStorage.ts'

export const createInitialOrderState = () => ({
  items: readOrders(),
})
