import type { Session } from '@supabase/supabase-js'

export type AuthMode = 'sign-in' | 'sign-up'
export type NoticeTone = 'error' | 'info' | 'success'

export type Notice = {
  message: string
  tone: NoticeTone
}

export type AuthPageState = {
  email: string
  fullName: string
  isSubmitting: boolean
  mode: AuthMode
  notice: Notice | null
  password: string
  session: Session | null
  showPassword: boolean
}
