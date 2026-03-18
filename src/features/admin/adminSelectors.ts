import type { OrderRecord } from '../orders/orderTypes.ts'
import type { ShopItem } from '../shop/shopTypes.ts'
import type { AdminDashboardData } from './adminTypes.ts'

const buildCategories = (products: ShopItem[]) => {
  const categoryCounts = new Map<string, number>()

  products.forEach((product) => {
    categoryCounts.set(product.era, (categoryCounts.get(product.era) ?? 0) + 1)
  })

  return Array.from(categoryCounts.entries()).map(([label, count]) => ({
    count,
    label,
  }))
}

const buildCustomers = (orders: OrderRecord[]) => {
  const customers = new Map<string, { email: string; orders: number; userId: string }>()

  orders.forEach((order) => {
    const existingCustomer = customers.get(order.userId)

    if (existingCustomer) {
      existingCustomer.orders += 1
      return
    }

    customers.set(order.userId, {
      email: order.email,
      orders: 1,
      userId: order.userId,
    })
  })

  return Array.from(customers.values())
}

const buildOrderSummary = (orders: OrderRecord[]) =>
  orders.reduce(
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

export const getAdminDashboardData = (
  products: ShopItem[],
  orders: OrderRecord[],
  searchTerm: string,
): AdminDashboardData => {
  const normalizedSearch = searchTerm.trim().toLowerCase()

  const filteredProducts = products.filter((product) => {
    if (!normalizedSearch) {
      return true
    }

    return `${product.name} ${product.seasonLabel} ${product.era} ${product.league}`
      .toLowerCase()
      .includes(normalizedSearch)
  })

  const filteredOrders = orders.filter((order) => {
    if (!normalizedSearch) {
      return true
    }

    return `${order.id} ${order.email} ${order.status} ${order.items
      .map((item) => `${item.product.name} ${item.product.seasonLabel}`)
      .join(' ')}`
      .toLowerCase()
      .includes(normalizedSearch)
  })

  const customers = buildCustomers(filteredOrders)
  const categories = buildCategories(filteredProducts)
  const orderSummary = buildOrderSummary(filteredOrders)

  return {
    categories,
    customers,
    filteredProducts,
    orderSummary,
    recentOrders: filteredOrders.slice(0, 5),
    recentProducts: filteredProducts.slice(0, 5),
    stats: {
      outOfStock: 0,
      totalCustomers: Math.max(customers.length, 1),
      totalOrders: orders.length,
      totalProducts: products.length,
    },
  }
}
