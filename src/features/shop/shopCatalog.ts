import type { ProductStatus, ShopItem } from './shopTypes.ts'

const productStorageKey = 'core-diski-products'

const createProduct = (product: ShopItem): ShopItem => product

const defaultShopCatalog: ShopItem[] = [
  createProduct({
    authenticity: 'Verified',
    availableSizes: ['S', 'M', 'L', 'XL'],
    clubOrNation: 'Manchester United',
    condition: 'Excellent',
    description:
      'The Manchester United 1998-1999 home shirt is one of the standout kits in football history, celebrated by collectors for its story and design. Each jersey is professionally inspected and authenticated before listing.',
    era: '1990s',
    freeShipping: true,
    id: 'man-united-1998-home',
    imageTheme: 'theme-united',
    imageUrl: null,
    isFeatured: true,
    isWishlisted: false,
    league: 'Classic Archive',
    name: 'Manchester United',
    price: 250,
    seasonLabel: '1998-1999 Home',
    status: 'active',
    tags: ['manchester united', 'premier league', 'treble'],
    variant: 'Home',
    year: 1998,
  }),
  createProduct({
    authenticity: 'Verified',
    availableSizes: ['M', 'L', 'XL'],
    clubOrNation: 'Barcelona',
    condition: 'Excellent',
    description:
      'Barcelona 2008-2009 home shirts remain one of the defining modern-era jerseys. This piece is sourced for collectors who want a clean, display-worthy classic with verified authenticity.',
    era: '2000s',
    freeShipping: true,
    id: 'barcelona-2008-home',
    imageTheme: 'theme-barcelona',
    imageUrl: null,
    isFeatured: true,
    isWishlisted: false,
    league: 'La Liga Archive',
    name: 'Barcelona',
    price: 275,
    seasonLabel: '2008-2009 Home',
    status: 'active',
    tags: ['barcelona', 'la liga', 'pep'],
    variant: 'Home',
    year: 2008,
  }),
  createProduct({
    authenticity: 'Verified',
    availableSizes: ['S', 'M', 'L'],
    clubOrNation: 'Italy',
    condition: 'Very Good',
    description:
      'Italy 1994 home shirts carry timeless tournament nostalgia and bold, unmistakable character. This listing is part of our verified heritage collection for serious shirt lovers.',
    era: '1990s',
    freeShipping: true,
    id: 'italy-1994-home',
    imageTheme: 'theme-italy',
    imageUrl: null,
    isFeatured: true,
    isWishlisted: false,
    league: 'National Team Archive',
    name: 'Italy',
    price: 180,
    seasonLabel: '1994 Home',
    status: 'active',
    tags: ['italy', 'national', 'world cup'],
    variant: 'Home',
    year: 1994,
  }),
  createProduct({
    authenticity: 'Verified',
    availableSizes: ['M', 'L', 'XL'],
    clubOrNation: 'Brazil',
    condition: 'Excellent',
    description:
      'Brazil 2002 home shirts remain among the most iconic international kits ever produced. This jersey is authenticated and prepared for collectors who value golden-era football design.',
    era: '2000s',
    freeShipping: true,
    id: 'brazil-2002-home',
    imageTheme: 'theme-brazil',
    imageUrl: null,
    isFeatured: true,
    isWishlisted: false,
    league: 'National Team Archive',
    name: 'Brazil',
    price: 300,
    seasonLabel: '2002 Home',
    status: 'active',
    tags: ['brazil', 'world cup', 'ronaldo'],
    variant: 'Home',
    year: 2002,
  }),
  createProduct({
    authenticity: 'Verified',
    availableSizes: ['M', 'L', 'XL'],
    clubOrNation: 'Real Madrid',
    condition: 'Excellent',
    description:
      'Real Madrid 2014 home shirts sit at the intersection of modern tailoring and trophy-era status. It is an ideal entry point for collectors who want a contemporary European classic.',
    era: '2010s',
    freeShipping: true,
    id: 'real-madrid-2014-home',
    imageTheme: 'theme-madrid',
    imageUrl: null,
    isFeatured: true,
    isWishlisted: true,
    league: 'Champions Collection',
    name: 'Real Madrid',
    price: 225,
    seasonLabel: '2011-2012 Away',
    status: 'active',
    tags: ['real madrid', 'la liga', 'away kit'],
    variant: 'Away',
    year: 2011,
  }),
]

const inferEra = (year: number) => {
  if (year >= 2010) {
    return '2010s'
  }

  if (year >= 2000) {
    return '2000s'
  }

  return '1990s'
}

const normalizeStatus = (value: unknown): ProductStatus => (value === 'active' ? 'active' : 'active')

const normalizeProduct = (value: ShopItem): ShopItem => ({
  ...value,
  clubOrNation: value.clubOrNation || value.name,
  imageUrl: value.imageUrl?.trim() || null,
  isFeatured: Boolean(value.isFeatured),
  seasonLabel: value.seasonLabel,
  status: normalizeStatus(value.status),
  tags: Array.isArray(value.tags) ? value.tags : [],
  variant: value.variant || 'Home',
})

const isValidProduct = (value: unknown): value is ShopItem => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const product = value as Partial<ShopItem>

  return (
    typeof product.id === 'string' &&
    typeof product.name === 'string' &&
    typeof product.clubOrNation === 'string' &&
    typeof product.price === 'number' &&
    typeof product.year === 'number' &&
    typeof product.seasonLabel === 'string' &&
    typeof product.variant === 'string' &&
    Array.isArray(product.availableSizes)
  )
}

const readStoredCatalog = (): ShopItem[] => {
  if (typeof window === 'undefined') {
    return defaultShopCatalog.map(normalizeProduct)
  }

  try {
    const rawValue = window.localStorage.getItem(productStorageKey)

    if (!rawValue) {
      return defaultShopCatalog.map(normalizeProduct)
    }

    const parsedValue = JSON.parse(rawValue)

    if (!Array.isArray(parsedValue)) {
      return defaultShopCatalog.map(normalizeProduct)
    }

    const nextCatalog = parsedValue.filter(isValidProduct).map(normalizeProduct)

    return nextCatalog.length ? nextCatalog : defaultShopCatalog.map(normalizeProduct)
  } catch {
    return defaultShopCatalog.map(normalizeProduct)
  }
}

export const shopCatalog: ShopItem[] = readStoredCatalog()

export const persistShopCatalog = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(productStorageKey, JSON.stringify(shopCatalog))
}

export const hydrateShopCatalog = () => {
  const nextCatalog = readStoredCatalog()

  shopCatalog.splice(0, shopCatalog.length, ...nextCatalog)
}

export const replaceShopCatalog = (nextCatalog: ShopItem[]) => {
  shopCatalog.splice(0, shopCatalog.length, ...nextCatalog.map(normalizeProduct))
  persistShopCatalog()
}

export const createShopProductId = (clubOrNation: string, season: string, variant: string) =>
  `${clubOrNation}-${season}-${variant}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const buildAdminProduct = ({
  clubOrNation,
  existingId,
  imageTheme,
  imageUrl,
  isFeatured,
  price,
  productTitle,
  tags,
  variant,
  year,
}: {
  clubOrNation: string
  existingId?: string
  imageTheme?: string
  imageUrl: string
  isFeatured: boolean
  price: number
  productTitle: string
  tags: string[]
  variant: string
  year: number
}): ShopItem => ({
  authenticity: 'Verified',
  availableSizes: ['S', 'M', 'L', 'XL'],
  clubOrNation,
  condition: 'Excellent',
  description: `${productTitle} ${variant} shirt available in the Core Diski collection.`,
  era: inferEra(year),
  freeShipping: true,
  id: existingId ?? createShopProductId(clubOrNation, `${year}`, variant),
  imageTheme: imageTheme ?? 'theme-classic',
  imageUrl: imageUrl.trim() || null,
  isFeatured,
  isWishlisted: false,
  league: 'Storefront Collection',
  name: productTitle,
  price,
  seasonLabel: `${year}-${year + 1} ${variant}`,
  status: 'active',
  tags,
  variant,
  year,
})

export const upsertShopProduct = (product: ShopItem) => {
  const existingIndex = shopCatalog.findIndex((item) => item.id === product.id)

  if (existingIndex >= 0) {
    shopCatalog.splice(existingIndex, 1, normalizeProduct(product))
  } else {
    shopCatalog.unshift(normalizeProduct(product))
  }

  persistShopCatalog()
}

export const shopTeams = () => Array.from(new Set(shopCatalog.map((product) => product.name))).sort()
