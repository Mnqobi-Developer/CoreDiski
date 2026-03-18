import type { Notice } from '../../shared/types/notice.ts'
import type { OrderRecord, OrderSummary, PaymentStatus } from '../orders/orderTypes.ts'
import type { ProfileRecord, UserRole } from '../profile/profileTypes.ts'
import type { ShopItem } from '../shop/shopTypes.ts'

export type AdminView = 'analytics' | 'customers' | 'dashboard' | 'orders' | 'products' | 'settings'

export type AdminSettingsCurrency = 'EUR' | 'GBP' | 'USD' | 'ZAR'

export type AdminCustomerRecord = ProfileRecord & {
  orderCount: number
}

export type AdminCustomerStats = {
  admins: number
  customers: number
  profilesCompleted: number
  totalAccounts: number
}

export type AdminDashboardStats = {
  outOfStock: number
  totalCustomers: number
  totalOrders: number
  totalProducts: number
}

export type AdminAnalyticsProduct = {
  id: string
  performancePercent: number
  revenue: number
  title: string
  unitsSold: number
}

export type AdminRevenueActivity = {
  createdAt: string
  email: string
  id: string
  paymentStatus: PaymentStatus
  total: number
}

export type AdminAnalyticsData = {
  averageOrderValue: number
  orderConversionRate: number
  paidRevenue: number
  recentRevenueActivity: AdminRevenueActivity[]
  topSellingProducts: AdminAnalyticsProduct[]
  totalRevenue: number
}

export type AdminSettingsForm = {
  currency: AdminSettingsCurrency
  flatShippingRate: string
  lastUpdatedAt: string
  lowStockThreshold: string
  maintenanceMode: boolean
  requireNewsletterDoubleOptIn: boolean
  sendAdminNotifications: boolean
  storeName: string
  supportEmail: string
  supportPhone: string
  taxRate: string
}

export type AdminDashboardData = {
  analytics: AdminAnalyticsData
  averagePaidOrderValue: number
  customerStats: AdminCustomerStats
  filteredProducts: ShopItem[]
  filteredOrders: OrderRecord[]
  filteredCustomers: AdminCustomerRecord[]
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
  totalPaidOrders: number
  totalPendingApprovalOrders: number
}

export type AdminProductForm = {
  authenticity: string
  clubOrNation: string
  condition: string
  imageUrl: string
  isFeatured: boolean
  league: string
  price: string
  productTitle: string
  season: string
  tags: string
  variant: string
}

export type AdminState = {
  activeView: AdminView
  customerFilter: 'all' | UserRole
  editingProductId: string | null
  form: AdminProductForm
  orderFilter: 'all' | PaymentStatus
  notice: Notice | null
  settingsForm: AdminSettingsForm
}
