import {
  getAveragePaidOrderValue,
  getOrderSummary,
  getPaidOrderCount,
  getPendingPaymentCount,
} from '../orders/orderSelectors.ts'
import type { OrderRecord, PaymentStatus } from '../orders/orderTypes.ts'
import type { ProfileRecord, UserRole } from '../profile/profileTypes.ts'
import type { ShopItem } from '../shop/shopTypes.ts'
import type { AdminAnalyticsProduct, AdminCustomerRecord, AdminDashboardData } from './adminTypes.ts'

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

const buildCustomerDirectory = (profiles: ProfileRecord[], orders: OrderRecord[]): AdminCustomerRecord[] => {
  const orderCounts = new Map<string, number>()

  orders.forEach((order) => {
    orderCounts.set(order.userId, (orderCounts.get(order.userId) ?? 0) + 1)
  })

  return profiles
    .filter((profile) => profile.isActive)
    .map((profile) => ({
      ...profile,
      orderCount: orderCounts.get(profile.id) ?? 0,
    }))
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
}

const buildCustomerStats = (profiles: ProfileRecord[]) => {
  const activeProfiles = profiles.filter((profile) => profile.isActive)
  const admins = activeProfiles.filter((profile) => profile.role === 'admin').length
  const customers = activeProfiles.filter((profile) => profile.role === 'customer').length
  const profilesCompleted = activeProfiles.filter(
    (profile) => profile.fullName.trim() && profile.phone?.trim() && profile.address?.trim(),
  ).length

  return {
    admins,
    customers,
    profilesCompleted,
    totalAccounts: activeProfiles.length,
  }
}

const buildDashboardCustomers = (customers: AdminCustomerRecord[]) =>
  customers.slice(0, 5).map((customer) => ({
    email: customer.email,
    orders: customer.orderCount,
    userId: customer.id,
  }))

const buildTopSellingProducts = (orders: OrderRecord[]): AdminAnalyticsProduct[] => {
  const paidOrders = orders.filter((order) => order.paymentStatus === 'paid')
  const paidRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0)
  const productSales = new Map<string, AdminAnalyticsProduct>()

  paidOrders.forEach((order) => {
    order.items.forEach((item) => {
      const existingProduct = productSales.get(item.product.id)
      const lineRevenue = item.product.price * item.quantity

      if (existingProduct) {
        existingProduct.revenue += lineRevenue
        existingProduct.unitsSold += item.quantity
        return
      }

      productSales.set(item.product.id, {
        id: item.product.id,
        performancePercent: 0,
        revenue: lineRevenue,
        title: `${item.product.name} ${item.product.variant}`,
        unitsSold: item.quantity,
      })
    })
  })

  return Array.from(productSales.values())
    .sort((left, right) => right.revenue - left.revenue || right.unitsSold - left.unitsSold)
    .slice(0, 5)
    .map((product) => ({
      ...product,
      performancePercent: paidRevenue ? Math.round((product.revenue / paidRevenue) * 100) : 0,
    }))
}

const getOrderConversionRate = (orders: OrderRecord[]) => {
  if (!orders.length) {
    return 0
  }

  return Math.round((getPaidOrderCount(orders) / orders.length) * 100)
}

export const getAdminDashboardData = (
  products: ShopItem[],
  orders: OrderRecord[],
  profiles: ProfileRecord[],
  searchTerm: string,
  orderFilter: 'all' | PaymentStatus,
  customerFilter: 'all' | UserRole,
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

    return `${order.id} ${order.email} ${order.status} ${order.shippingAddress} ${order.items
      .map((item) => `${item.product.name} ${item.product.seasonLabel}`)
      .join(' ')}`
      .toLowerCase()
      .includes(normalizedSearch)
  })

  const filteredOrdersByStatus =
    orderFilter === 'all'
      ? filteredOrders
      : filteredOrders.filter((order) => order.paymentStatus === orderFilter)

  const customerDirectory = buildCustomerDirectory(profiles, orders)
  const filteredCustomers = customerDirectory.filter((customer) => {
    if (customerFilter !== 'all' && customer.role !== customerFilter) {
      return false
    }

    if (!normalizedSearch) {
      return true
    }

    return `${customer.fullName} ${customer.email} ${customer.phone ?? ''} ${customer.address ?? ''} ${customer.role}`
      .toLowerCase()
      .includes(normalizedSearch)
  })

  const categories = buildCategories(filteredProducts)
  const customerStats = buildCustomerStats(profiles)
  const orderSummary = getOrderSummary(filteredOrders)
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0)
  const paidRevenue = filteredOrders
    .filter((order) => order.paymentStatus === 'paid')
    .reduce((sum, order) => sum + order.total, 0)

  return {
    analytics: {
      averageOrderValue: getAveragePaidOrderValue(filteredOrders),
      orderConversionRate: getOrderConversionRate(filteredOrders),
      paidRevenue,
      recentRevenueActivity: filteredOrders.slice(0, 6).map((order) => ({
        createdAt: order.createdAt,
        email: order.email,
        id: order.id,
        paymentStatus: order.paymentStatus,
        total: order.total,
      })),
      topSellingProducts: buildTopSellingProducts(filteredOrders),
      totalRevenue,
    },
    averagePaidOrderValue: getAveragePaidOrderValue(orders),
    categories,
    customerStats,
    customers: buildDashboardCustomers(customerDirectory),
    filteredCustomers,
    filteredOrders: filteredOrdersByStatus,
    filteredProducts,
    orderSummary,
    recentOrders: filteredOrders.slice(0, 5),
    recentProducts: filteredProducts.slice(0, 5),
    stats: {
      outOfStock: 0,
      totalCustomers: customerStats.customers,
      totalOrders: orders.length,
      totalProducts: products.length,
    },
    totalPaidOrders: getPaidOrderCount(orders),
    totalPendingApprovalOrders: getPendingPaymentCount(orders),
  }
}
