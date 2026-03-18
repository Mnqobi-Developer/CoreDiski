import type { Notice } from '../../shared/types/notice.ts'
import type { OrderRecord, OrderSummary } from '../orders/orderTypes.ts'

export type UserRole = 'admin' | 'customer'

export type ProfileRecord = {
  address: string | null
  completedOrders: number
  createdAt: string
  email: string
  emailPreferences: string
  fullName: string
  id: string
  pendingOrders: number
  phone: string | null
  role: UserRole
  shippedOrders: number
}

export type ProfileFormValues = {
  address: string
  emailPreferences: string
  fullName: string
  phone: string
}

export type ProfilePageState = {
  form: ProfileFormValues
  isEditing: boolean
  isLoading: boolean
  orderHistory: OrderRecord[]
  orderSummary: OrderSummary
  isSaving: boolean
  notice: Notice | null
  profile: ProfileRecord | null
}
