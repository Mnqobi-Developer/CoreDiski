import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase.ts'
import type { ProfileFormValues, ProfileRecord, UserRole } from './profileTypes.ts'

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
  role?: string | null
  shipped_orders: number | null
}

const profileColumnsWithRole = `
  id,
  full_name,
  email,
  phone,
  address,
  email_preferences,
  pending_orders,
  shipped_orders,
  completed_orders,
  role,
  created_at
`

const profileColumnsWithoutRole = `
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

const getSessionRole = (session: Session): UserRole =>
  session.user.user_metadata.role === 'admin' ? 'admin' : 'customer'

const isMissingRoleColumnError = (error: { message?: string } | null) =>
  Boolean(error?.message?.toLowerCase().includes('role'))

const mapProfileRow = (row: ProfileRow, fallbackRole: UserRole): ProfileRecord => ({
  address: row.address,
  completedOrders: row.completed_orders ?? 0,
  createdAt: row.created_at,
  email: row.email,
  emailPreferences: row.email_preferences ?? 'General updates',
  fullName: row.full_name,
  id: row.id,
  pendingOrders: row.pending_orders ?? 0,
  phone: row.phone,
  role: row.role === 'admin' ? 'admin' : fallbackRole,
  shippedOrders: row.shipped_orders ?? 0,
})

const buildProfileSeed = (session: Session, includeRole: boolean) => {
  const seed = {
    email: session.user.email ?? '',
    email_preferences: 'General updates',
    full_name:
      typeof session.user.user_metadata.full_name === 'string'
        ? session.user.user_metadata.full_name.trim()
        : '',
    id: session.user.id,
  }

  if (!includeRole) {
    return seed
  }

  return {
    ...seed,
    role: getSessionRole(session),
  }
}

const selectProfile = async (session: Session, includeRole: boolean) =>
  supabase
    .from('profiles')
    .select(includeRole ? profileColumnsWithRole : profileColumnsWithoutRole)
    .eq('id', session.user.id)
    .maybeSingle<ProfileRow>()

export const loadOrCreateProfile = async (session: Session) => {
  const fallbackRole = getSessionRole(session)
  let includeRole = true
  let { data, error } = await selectProfile(session, includeRole)

  if (error && isMissingRoleColumnError(error)) {
    includeRole = false
    ;({ data, error } = await selectProfile(session, includeRole))
  }

  if (error) {
    return { data: null, error }
  }

  if (data) {
    return { data: mapProfileRow(data, fallbackRole), error: null }
  }

  const { data: createdProfile, error: createError } = await supabase
    .from('profiles')
    .upsert(buildProfileSeed(session, includeRole))
    .select(includeRole ? profileColumnsWithRole : profileColumnsWithoutRole)
    .single<ProfileRow>()

  if (createError || !createdProfile) {
    return { data: null, error: createError }
  }

  return { data: mapProfileRow(createdProfile, fallbackRole), error: null }
}

type SaveProfilePayload = {
  email: string
  form: ProfileFormValues
  userId: string
}

export const saveProfile = async ({ email, form, userId }: SaveProfilePayload) => {
  let includeRole = true
  let { data, error } = await supabase
    .from('profiles')
    .update({
      address: form.address.trim() || null,
      email,
      email_preferences: form.emailPreferences.trim() || 'General updates',
      full_name: form.fullName.trim(),
      phone: form.phone.trim() || null,
    })
    .eq('id', userId)
    .select(profileColumnsWithRole)
    .single<ProfileRow>()

  if (error && isMissingRoleColumnError(error)) {
    includeRole = false
    ;({ data, error } = await supabase
      .from('profiles')
      .update({
        address: form.address.trim() || null,
        email,
        email_preferences: form.emailPreferences.trim() || 'General updates',
        full_name: form.fullName.trim(),
        phone: form.phone.trim() || null,
      })
      .eq('id', userId)
      .select(profileColumnsWithoutRole)
      .single<ProfileRow>())
  }

  if (error || !data) {
    return { data: null, error }
  }

  return { data: mapProfileRow(data, includeRole ? 'customer' : 'customer'), error: null }
}
