import { supabase } from '../../lib/supabase.ts'
import type { AdminSettingsCurrency, AdminSettingsForm } from './adminTypes.ts'

type StoreSettingsRow = {
  currency: AdminSettingsCurrency
  flat_shipping_rate: number
  id: string
  last_updated_at: string
  low_stock_threshold: number
  maintenance_mode: boolean
  require_newsletter_double_opt_in: boolean
  send_admin_notifications: boolean
  store_name: string
  support_email: string
  support_phone: string
  tax_rate: number
}

const storeSettingsColumns = [
  'id',
  'store_name',
  'support_email',
  'support_phone',
  'currency',
  'tax_rate',
  'flat_shipping_rate',
  'low_stock_threshold',
  'maintenance_mode',
  'require_newsletter_double_opt_in',
  'send_admin_notifications',
  'last_updated_at',
].join(',\n')

export const STORE_SETTINGS_ROW_ID = 'core-diski'

const mapRowToForm = (row: StoreSettingsRow): AdminSettingsForm => ({
  currency: row.currency,
  flatShippingRate: `${row.flat_shipping_rate}`,
  lastUpdatedAt: row.last_updated_at,
  lowStockThreshold: `${row.low_stock_threshold}`,
  maintenanceMode: row.maintenance_mode,
  requireNewsletterDoubleOptIn: row.require_newsletter_double_opt_in,
  sendAdminNotifications: row.send_admin_notifications,
  storeName: row.store_name,
  supportEmail: row.support_email,
  supportPhone: row.support_phone,
  taxRate: `${row.tax_rate}`,
})

const mapFormToRow = (form: AdminSettingsForm, userId?: string) => ({
  currency: form.currency,
  flat_shipping_rate: Number(form.flatShippingRate),
  id: STORE_SETTINGS_ROW_ID,
  last_updated_at: form.lastUpdatedAt,
  low_stock_threshold: Number(form.lowStockThreshold),
  maintenance_mode: form.maintenanceMode,
  require_newsletter_double_opt_in: form.requireNewsletterDoubleOptIn,
  send_admin_notifications: form.sendAdminNotifications,
  store_name: form.storeName,
  support_email: form.supportEmail,
  support_phone: form.supportPhone,
  tax_rate: Number(form.taxRate),
  updated_by: userId ?? null,
})

export const getStoreSettings = async () => {
  const { data, error } = await supabase
    .from('store_settings')
    .select(storeSettingsColumns)
    .eq('id', STORE_SETTINGS_ROW_ID)
    .limit(1)
    .returns<StoreSettingsRow[]>()

  if (error) {
    return { data: null as AdminSettingsForm | null, error }
  }

  if (!data?.length) {
    return { data: null as AdminSettingsForm | null, error: null }
  }

  return { data: mapRowToForm(data[0]), error: null }
}

export const upsertStoreSettings = async (form: AdminSettingsForm, userId?: string) => {
  const { data, error } = await supabase
    .from('store_settings')
    .upsert(mapFormToRow(form, userId), { onConflict: 'id' })
    .select(storeSettingsColumns)
    .single<StoreSettingsRow>()

  if (error || !data) {
    return { data: null as AdminSettingsForm | null, error }
  }

  return { data: mapRowToForm(data), error: null }
}
