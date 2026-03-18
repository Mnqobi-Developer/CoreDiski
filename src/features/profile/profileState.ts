import type { ProfilePageState } from './profileTypes.ts'

export const createInitialProfileState = (): ProfilePageState => ({
  form: {
    address: '',
    emailPreferences: 'General updates',
    fullName: '',
    phone: '',
  },
  isEditing: false,
  isLoading: false,
  orderHistory: [],
  orderSummary: {
    completed: 0,
    pending: 0,
    shipped: 0,
  },
  isSaving: false,
  notice: null,
  profile: null,
})
