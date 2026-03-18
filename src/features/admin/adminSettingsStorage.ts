import type { AdminSettingsCurrency, AdminSettingsForm } from './adminTypes.ts'

const adminSettingsStorageKey = 'core-diski-admin-settings'

const adminCurrencies: AdminSettingsCurrency[] = ['ZAR', 'USD', 'EUR', 'GBP']

const isAdminSettingsCurrency = (value: unknown): value is AdminSettingsCurrency =>
  typeof value === 'string' && adminCurrencies.includes(value as AdminSettingsCurrency)

export const createDefaultAdminSettingsForm = (): AdminSettingsForm => ({
  currency: 'ZAR',
  flatShippingRate: '75',
  lastUpdatedAt: new Date().toISOString(),
  lowStockThreshold: '5',
  maintenanceMode: false,
  requireNewsletterDoubleOptIn: false,
  sendAdminNotifications: true,
  storeName: 'Core Diski',
  supportEmail: 'corediski@gmail.com',
  supportPhone: '+27 71 000 0000',
  taxRate: '0',
})

const isValidAdminSettings = (value: unknown): value is AdminSettingsForm => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<AdminSettingsForm>

  return (
    isAdminSettingsCurrency(candidate.currency) &&
    typeof candidate.flatShippingRate === 'string' &&
    typeof candidate.lastUpdatedAt === 'string' &&
    typeof candidate.lowStockThreshold === 'string' &&
    typeof candidate.maintenanceMode === 'boolean' &&
    typeof candidate.requireNewsletterDoubleOptIn === 'boolean' &&
    typeof candidate.sendAdminNotifications === 'boolean' &&
    typeof candidate.storeName === 'string' &&
    typeof candidate.supportEmail === 'string' &&
    typeof candidate.supportPhone === 'string' &&
    typeof candidate.taxRate === 'string'
  )
}

export const readAdminSettings = (): AdminSettingsForm => {
  if (typeof window === 'undefined') {
    return createDefaultAdminSettingsForm()
  }

  try {
    const rawValue = window.localStorage.getItem(adminSettingsStorageKey)

    if (!rawValue) {
      return createDefaultAdminSettingsForm()
    }

    const parsedValue = JSON.parse(rawValue)

    if (!isValidAdminSettings(parsedValue)) {
      return createDefaultAdminSettingsForm()
    }

    return {
      ...parsedValue,
      flatShippingRate: parsedValue.flatShippingRate === '0' ? '75' : parsedValue.flatShippingRate,
    }
  } catch {
    return createDefaultAdminSettingsForm()
  }
}

export const writeAdminSettings = (settings: AdminSettingsForm) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(adminSettingsStorageKey, JSON.stringify(settings))
}
