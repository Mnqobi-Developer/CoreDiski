import { isSupabaseConfigured } from '../../lib/supabase.ts'

export const getAuthStatusLabel = () => {
  if (!isSupabaseConfigured) {
    return 'Supabase not configured'
  }

  return 'Supabase auth ready'
}
