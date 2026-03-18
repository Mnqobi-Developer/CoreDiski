import type { OrderRecord, OrderSummary } from '../orders/orderTypes.ts'
import type { ShopItem } from '../shop/shopTypes.ts'

export type AdminView = 'dashboard' | 'products'

export type AdminDashboardStats = {
  outOfStock: number
  totalCustomers: number
  totalOrders: number
  totalProducts: number
}

export type AdminDashboardData = {
  filteredProducts: ShopItem[]
  categories: Array<{
    count: number
    label: string
  }>
  customers: Array<{
    email: string
    orders: number
    userId: string
  }>
  orderSummary: OrderSummary
  recentOrders: OrderRecord[]
  recentProducts: ShopItem[]
  stats: AdminDashboardStats
}

export type AdminProductForm = {
  clubOrNation: string
  imageUrl: string
  isFeatured: boolean
  price: string
  productTitle: string
  season: string
  tags: string
  variant: string
}

export type AdminState = {
  activeView: AdminView
  editingProductId: string | null
  form: AdminProductForm
  notice: {
    message: string
    tone: 'error' | 'info' | 'success'
  } | null
}
