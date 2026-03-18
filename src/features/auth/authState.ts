import { isSupabaseConfigured } from '../../lib/supabase.ts'
import type { AuthPageState } from './authTypes.ts'

export const createInitialAuthState = (): AuthPageState => ({
  email: '',
  fullName: '',
  isSubmitting: false,
  mode: 'sign-in',
  notice: isSupabaseConfigured
    ? null
    : {
        tone: 'error',
        message: 'Supabase environment variables are missing. Add them to .env and restart Vite.',
      },
  password: '',
  session: null,
  showPassword: false,
})
