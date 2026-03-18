import { createDefaultAdminSettingsForm, readAdminSettings } from './adminSettingsStorage.ts'
import type { AdminProductForm, AdminState } from './adminTypes.ts'

export const createEmptyAdminProductForm = (): AdminProductForm => ({
  authenticity: 'Verified',
  clubOrNation: '',
  condition: 'Excellent',
  imageUrl: '',
  isFeatured: false,
  league: 'Storefront Collection',
  price: '100',
  productTitle: '',
  season: '',
  tags: '',
  variant: '',
})

export const createInitialAdminState = (): AdminState => ({
  activeView: 'dashboard',
  customerFilter: 'all',
  editingProductId: null,
  form: createEmptyAdminProductForm(),
  orderFilter: 'all',
  notice: null,
  settingsForm: readAdminSettings(),
})

export { createDefaultAdminSettingsForm }
