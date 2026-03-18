import type { ShopFilters } from './shopTypes.ts'

export const createInitialShopFilters = (): ShopFilters => ({
  era: 'all',
  priceRange: 'all',
  searchTerm: '',
  selectedTeams: [],
  sortBy: 'most-popular',
})
