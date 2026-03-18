import { createClient } from '@supabase/supabase-js'

const envUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

export const supabaseUrl = envUrl || null
export const supabaseAnonKey = envAnonKey || null
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

const fallbackUrl = 'https://placeholder.supabase.co'
const fallbackAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder.placeholder'

export const supabase = createClient(
  supabaseUrl ?? fallbackUrl,
  supabaseAnonKey ?? fallbackAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)

export const getSupabaseEnvSummary = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return 'Set both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your local .env file.'
  }

  return `Connected to ${supabaseUrl}.`
}
