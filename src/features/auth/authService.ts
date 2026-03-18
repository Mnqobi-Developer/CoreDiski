import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase.ts'

type SignUpPayload = {
  email: string
  emailRedirectTo: string
  fullName: string
  password: string
}

type SignInPayload = {
  email: string
  password: string
}

export const signUpWithEmail = ({
  email,
  emailRedirectTo,
  fullName,
  password,
}: SignUpPayload) =>
  supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo,
    },
  })

export const signInWithEmail = ({ email, password }: SignInPayload) =>
  supabase.auth.signInWithPassword({
    email,
    password,
  })

export const signOutCurrentUser = () => supabase.auth.signOut()

export const getCurrentSession = () => supabase.auth.getSession()

export const subscribeToAuthChanges = (callback: (session: Session | null) => void) =>
  supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
