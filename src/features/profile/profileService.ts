import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase.ts'
import type { ProfileFormValues, ProfileRecord, UserRole } from './profileTypes.ts'

type ProfileColumnSupport = {
  includeIsActive: boolean
  includeRole: boolean
}

type ProfileRow = {
  address: string | null
  completed_orders: number | null
  created_at: string
  email: string
  email_preferences: string | null
  full_name: string
  id: string
  is_active?: boolean | null
  pending_orders: number | null
  phone: string | null
  role?: string | null
  shipped_orders: number | null
}

const buildProfileColumns = ({ includeIsActive, includeRole }: ProfileColumnSupport) =>
  [
    'id',
    'full_name',
    'email',
    'phone',
    'address',
    'email_preferences',
    'pending_orders',
    'shipped_orders',
    'completed_orders',
    includeRole ? 'role' : '',
    includeIsActive ? 'is_active' : '',
    'created_at',
  ]
    .filter(Boolean)
    .join(',\n')

const getSessionRole = (session: Session): UserRole =>
  session.user.user_metadata.role === 'admin' ? 'admin' : 'customer'

const isMissingColumnError = (error: { message?: string } | null, column: string) =>
  Boolean(error?.message?.toLowerCase().includes(column))

const mapProfileRow = (row: ProfileRow, fallbackRole: UserRole): ProfileRecord => ({
  address: row.address,
  completedOrders: row.completed_orders ?? 0,
  createdAt: row.created_at,
  email: row.email,
  emailPreferences: row.email_preferences ?? 'General updates',
  fullName: row.full_name,
  id: row.id,
  isActive: row.is_active ?? true,
  pendingOrders: row.pending_orders ?? 0,
  phone: row.phone,
  role: row.role === 'admin' || row.role === 'customer' ? row.role : fallbackRole,
  shippedOrders: row.shipped_orders ?? 0,
})

const buildProfileSeed = (session: Session, support: ProfileColumnSupport) => {
  const seed = {
    email: session.user.email ?? '',
    email_preferences: 'General updates',
    full_name:
      typeof session.user.user_metadata.full_name === 'string'
        ? session.user.user_metadata.full_name.trim()
        : '',
    id: session.user.id,
  }

  return {
    ...seed,
    ...(support.includeIsActive ? { is_active: true } : {}),
    ...(support.includeRole ? { role: getSessionRole(session) } : {}),
  }
}

const resolveProfileQuery = async <T>(
  runner: (support: ProfileColumnSupport) => Promise<{ data: T | null; error: { message?: string } | null }>,
) => {
  const support: ProfileColumnSupport = {
    includeIsActive: true,
    includeRole: true,
  }

  while (true) {
    const result = await runner(support)

    if (result.error && support.includeIsActive && isMissingColumnError(result.error, 'is_active')) {
      support.includeIsActive = false
      continue
    }

    if (result.error && support.includeRole && isMissingColumnError(result.error, 'role')) {
      support.includeRole = false
      continue
    }

    return {
      ...result,
      support: { ...support },
    }
  }
}

const selectProfile = async (session: Session, support: ProfileColumnSupport) =>
  supabase
    .from('profiles')
    .select(buildProfileColumns(support))
    .eq('id', session.user.id)
    .maybeSingle<ProfileRow>()

export const loadOrCreateProfile = async (session: Session) => {
  const fallbackRole = getSessionRole(session)
  const { data, error, support } = await resolveProfileQuery<ProfileRow | null>((columnSupport) =>
    selectProfile(session, columnSupport),
  )

  if (error) {
    return { data: null, error }
  }

  if (data) {
    return { data: mapProfileRow(data, fallbackRole), error: null }
  }

  const { data: createdProfile, error: createError } = await resolveProfileQuery<ProfileRow>(
    async (columnSupport) =>
      await supabase
        .from('profiles')
        .upsert(buildProfileSeed(session, columnSupport))
        .select(buildProfileColumns(columnSupport))
        .single<ProfileRow>(),
  )

  if (createError || !createdProfile) {
    return { data: null, error: createError }
  }

  return {
    data: mapProfileRow(createdProfile, support.includeRole ? fallbackRole : 'customer'),
    error: null,
  }
}

export const listProfilesForAdmin = async () => {
  const { data, error, support } = await resolveProfileQuery<ProfileRow[]>(
    async (columnSupport) =>
      await supabase
        .from('profiles')
        .select(buildProfileColumns(columnSupport))
        .order('created_at', { ascending: false })
        .returns<ProfileRow[]>(),
  )

  if (error || !data) {
    return { data: [] as ProfileRecord[], error }
  }

  return {
    data: data.map((row) => mapProfileRow(row, support.includeRole ? 'customer' : 'customer')),
    error: null,
  }
}

type SaveProfilePayload = {
  email: string
  form: ProfileFormValues
  userId: string
}

export const saveProfile = async ({ email, form, userId }: SaveProfilePayload) => {
  const { data, error, support } = await resolveProfileQuery<ProfileRow>(
    async (columnSupport) =>
      await supabase
        .from('profiles')
        .update({
          address: form.address.trim() || null,
          email,
          email_preferences: form.emailPreferences.trim() || 'General updates',
          full_name: form.fullName.trim(),
          phone: form.phone.trim() || null,
        })
        .eq('id', userId)
        .select(buildProfileColumns(columnSupport))
        .single<ProfileRow>(),
  )

  if (error || !data) {
    return { data: null, error }
  }

  return {
    data: mapProfileRow(data, support.includeRole ? 'customer' : 'customer'),
    error: null,
  }
}

export const updateProfileRole = async (profileId: string, role: UserRole) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', profileId)
    .select(buildProfileColumns({ includeIsActive: true, includeRole: true }))
    .single<ProfileRow>()

  if (error || !data) {
    return { data: null, error }
  }

  return { data: mapProfileRow(data, role), error: null }
}

export const updateProfileActiveStatus = async (profileId: string, isActive: boolean) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', profileId)
    .select(buildProfileColumns({ includeIsActive: true, includeRole: true }))
    .single<ProfileRow>()

  if (error || !data) {
    return { data: null, error }
  }

  return { data: mapProfileRow(data, data.role === 'admin' ? 'admin' : 'customer'), error: null }
}
