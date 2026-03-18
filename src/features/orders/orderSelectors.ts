import type { OrderRecord, OrderSummary } from './orderTypes.ts'

export const getOrdersForUser = (orders: OrderRecord[], userId: string) =>
  orders
    .filter((order) => order.userId === userId)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())

export const getOrderSummary = (orders: OrderRecord[]): OrderSummary =>
  orders.reduce<OrderSummary>(
    (summary, order) => {
      summary[order.status] += 1
      return summary
    },
    {
      completed: 0,
      pending: 0,
      shipped: 0,
    },
  )
