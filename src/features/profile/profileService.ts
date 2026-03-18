import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase.ts'
import type { ProfileFormValues, ProfileRecord } from './profileTypes.ts'

type ProfileRow = {
  address: string | null
  completed_orders: number | null
  created_at: string
  email: string
  email_preferences: string | null
  full_name: string
  id: string
  pending_orders: number | null
  phone: string | null
  shipped_orders: number | null
}

const profileColumns = `
  id,
  full_name,
  email,
  phone,
  address,
  email_preferences,
  pending_orders,
  shipped_orders,
  completed_orders,
  created_at
`

const mapProfileRow = (row: ProfileRow): ProfileRecord => ({
  address: row.address,
  completedOrders: row.completed_orders ?? 0,
  createdAt: row.created_at,
  email: row.email,
  emailPreferences: row.email_preferences ?? 'General updates',
  fullName: row.full_name,
  id: row.id,
  pendingOrders: row.pending_orders ?? 0,
  phone: row.phone,
  shippedOrders: row.shipped_orders ?? 0,
})

const buildProfileSeed = (session: Session) => ({
  email: session.user.email ?? '',
  email_preferences: 'General updates',
  full_name:
    typeof session.user.user_metadata.full_name === 'string'
      ? session.user.user_metadata.full_name.trim()
      : '',
  id: session.user.id,
})

export const loadOrCreateProfile = async (session: Session) => {
  const { data, error } = await supabase
    .from('profiles')
    .select(profileColumns)
    .eq('id', session.user.id)
    .maybeSingle<ProfileRow>()

  if (error) {
    return { data: null, error }
  }

  if (data) {
    return { data: mapProfileRow(data), error: null }
  }

  const { data: createdProfile, error: createError } = await supabase
    .from('profiles')
    .upsert(buildProfileSeed(session))
    .select(profileColumns)
    .single<ProfileRow>()

  if (createError || !createdProfile) {
    return { data: null, error: createError }
  }

  return { data: mapProfileRow(createdProfile), error: null }
}

type SaveProfilePayload = {
  email: string
  form: ProfileFormValues
  userId: string
}

export const saveProfile = async ({ email, form, userId }: SaveProfilePayload) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      address: form.address.trim() || null,
      email,
      email_preferences: form.emailPreferences.trim() || 'General updates',
      full_name: form.fullName.trim(),
      phone: form.phone.trim() || null,
    })
    .eq('id', userId)
    .select(profileColumns)
    .single<ProfileRow>()

  if (error || !data) {
    return { data: null, error }
  }

  return { data: mapProfileRow(data), error: null }
}
