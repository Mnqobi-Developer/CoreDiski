import type { OrderRecord, OrderSummary } from './orderTypes.ts'

export const getOrdersForUser = (orders: OrderRecord[], userId: string) =>
  orders
    .filter((order) => order.userId === userId)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())

export const getOrderSummary = (orders: OrderRecord[]): OrderSummary =>
  orders.reduce<OrderSummary>(
    (summary, order) => {
      if (order.paymentStatus !== 'paid') {
        return summary
      }

      summary[order.status] += 1
      return summary
    },
    {
      completed: 0,
      pending: 0,
      shipped: 0,
    },
  )

export const getPaidOrderCount = (orders: OrderRecord[]) =>
  orders.filter((order) => order.paymentStatus === 'paid').length

export const getPendingPaymentCount = (orders: OrderRecord[]) =>
  orders.filter((order) => order.paymentStatus === 'awaiting_approval').length

export const getAveragePaidOrderValue = (orders: OrderRecord[]) => {
  const paidOrders = orders.filter((order) => order.paymentStatus === 'paid')

  if (!paidOrders.length) {
    return 0
  }

  const totalValue = paidOrders.reduce((sum, order) => sum + order.total, 0)

  return Math.round(totalValue / paidOrders.length)
}
