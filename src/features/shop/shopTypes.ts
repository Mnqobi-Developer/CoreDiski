export type ShopEra = '1990s' | '2000s' | '2010s' | 'All eras'

export type PriceRange = 'all' | '0-200' | '201-300' | '301-500'

export type SortOption = 'most-popular' | 'price-low-high' | 'price-high-low' | 'latest'

export type ShirtSize = 'S' | 'M' | 'L' | 'XL'

export type ProductStatus = 'active'

export type ShopItem = {
  authenticity: string
  availableSizes: ShirtSize[]
  clubOrNation: string
  condition: string
  description: string
  era: ShopEra
  freeShipping: boolean
  id: string
  imageUrl: string | null
  imageTheme: string
  isFeatured: boolean
  isWishlisted: boolean
  league: string
  name: string
  price: number
  seasonLabel: string
  status: ProductStatus
  tags: string[]
  variant: string
  year: number
}

export type ShopFilters = {
  era: ShopEra | 'all'
  priceRange: PriceRange
  searchTerm: string
  selectedTeams: string[]
  sortBy: SortOption
}
