import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured } from '../../lib/supabase.ts'

export const getDisplayName = (session: Session | null) => {
  const fullName = session?.user.user_metadata.full_name

  if (typeof fullName === 'string' && fullName.trim()) {
    return fullName.trim()
  }

  const email = session?.user.email

  if (email) {
    return email.split('@')[0]
  }

  return 'Supporter'
}

export const getConnectionLabel = (session: Session | null) => {
  if (!isSupabaseConfigured) {
    return 'Supabase not configured'
  }

  if (session) {
    return 'Signed in to Supabase'
  }

  return 'Supabase auth ready'
}
