import type { Notice } from '../../shared/types/notice.ts'

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
  isSaving: boolean
  notice: Notice | null
  profile: ProfileRecord | null
}
