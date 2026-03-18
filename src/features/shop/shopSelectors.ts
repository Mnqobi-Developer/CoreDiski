import { shopCatalog } from './shopCatalog.ts'
import type { PriceRange, ShopFilters, ShopItem, SortOption } from './shopTypes.ts'

const matchesPriceRange = (price: number, range: PriceRange) => {
  if (range === 'all') {
    return true
  }

  if (range === '0-500') {
    return price <= 500
  }

  if (range === '500-1000') {
    return price >= 500 && price <= 1000
  }

  if (range === '1000-2000') {
    return price >= 1000 && price <= 2000
  }

  return price >= 2000
}

const sortItems = (items: ShopItem[], sortBy: SortOption) => {
  const nextItems = [...items]

  if (sortBy === 'price-low-high') {
    return nextItems.sort((left, right) => left.price - right.price)
  }

  if (sortBy === 'price-high-low') {
    return nextItems.sort((left, right) => right.price - left.price)
  }

  if (sortBy === 'latest') {
    return nextItems.sort((left, right) => right.year - left.year)
  }

  return nextItems.sort((left, right) => {
    if (left.isFeatured === right.isFeatured) {
      return left.name.localeCompare(right.name)
    }

    return left.isFeatured ? -1 : 1
  })
}

export const getFilteredShopItems = (filters: ShopFilters) => {
  const normalizedSearch = filters.searchTerm.trim().toLowerCase()

  const filtered = shopCatalog.filter((item) => {
    const matchesSearch =
      !normalizedSearch ||
      `${item.name} ${item.seasonLabel} ${item.era}`.toLowerCase().includes(normalizedSearch)

    const matchesTeam =
      filters.selectedTeams.length === 0 || filters.selectedTeams.includes(item.name)

    const matchesEra = filters.era === 'all' || item.era === filters.era

    return (
      matchesSearch &&
      matchesTeam &&
      matchesEra &&
      matchesPriceRange(item.price, filters.priceRange)
    )
  })

  return sortItems(filtered, filters.sortBy)
}
