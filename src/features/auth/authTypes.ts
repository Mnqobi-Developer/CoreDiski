export type AuthMode = 'sign-in' | 'sign-up'
import type { Notice } from '../../shared/types/notice.ts'

export type AuthPageState = {
  email: string
  fullName: string
  isSubmitting: boolean
  mode: AuthMode
  notice: Notice | null
  password: string
  showPassword: boolean
}
