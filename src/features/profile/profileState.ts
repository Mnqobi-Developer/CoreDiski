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
  isSaving: false,
  notice: null,
  profile: null,
})
