import type { AdminProductForm, AdminState } from './adminTypes.ts'

export const createEmptyAdminProductForm = (): AdminProductForm => ({
  clubOrNation: '',
  imageUrl: '',
  isFeatured: false,
  price: '100',
  productTitle: '',
  season: '',
  tags: '',
  variant: '',
})

export const createInitialAdminState = (): AdminState => ({
  activeView: 'dashboard',
  editingProductId: null,
  form: createEmptyAdminProductForm(),
  notice: null,
})
