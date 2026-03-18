import { supabase } from '../../lib/supabase.ts'
import { normalizeShopProduct } from './shopCatalog.ts'
import type { ShirtSize, ShopEra, ShopItem } from './shopTypes.ts'

type ProductRow = {
  authenticity: string | null
  available_sizes: unknown
  club_or_nation: string
  condition: string | null
  description: string | null
  era: ShopEra
  free_shipping: boolean | null
  id: string
  image_theme: string | null
  image_url: string | null
  is_featured: boolean | null
  league: string | null
  name: string
  price: number
  season_label: string
  status: 'active'
  tags: unknown
  variant: string
  year: number
}

const productColumns = [
  'id',
  'name',
  'club_or_nation',
  'variant',
  'season_label',
  'year',
  'price',
  'image_url',
  'image_theme',
  'era',
  'league',
  'description',
  'authenticity',
  'condition',
  'status',
  'tags',
  'available_sizes',
  'is_featured',
  'free_shipping',
].join(',\n')

const isShirtSize = (value: unknown): value is ShirtSize =>
  value === 'S' || value === 'M' || value === 'L' || value === 'XL'

const parseSizes = (value: unknown): ShirtSize[] => {
  if (!Array.isArray(value)) {
    return ['S', 'M', 'L', 'XL']
  }

  const sizes = value.filter(isShirtSize)

  return sizes.length ? sizes : ['S', 'M', 'L', 'XL']
}

const parseTags = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []

const mapProductRow = (row: ProductRow): ShopItem =>
  normalizeShopProduct({
    authenticity: row.authenticity ?? 'Verified',
    availableSizes: parseSizes(row.available_sizes),
    clubOrNation: row.club_or_nation,
    condition: row.condition ?? 'Excellent',
    description: row.description ?? '',
    era: row.era,
    freeShipping: row.free_shipping ?? true,
    id: row.id,
    imageTheme: row.image_theme ?? 'theme-classic',
    imageUrl: row.image_url,
    isFeatured: row.is_featured ?? false,
    isWishlisted: false,
    league: row.league ?? 'Storefront Collection',
    name: row.name,
    price: Number(row.price),
    seasonLabel: row.season_label,
    status: row.status,
    tags: parseTags(row.tags),
    variant: row.variant,
    year: row.year,
  })

const mapProductToRow = (product: ShopItem, userId?: string) => ({
  authenticity: product.authenticity,
  available_sizes: product.availableSizes,
  club_or_nation: product.clubOrNation,
  condition: product.condition,
  created_by: userId ?? null,
  description: product.description,
  era: product.era,
  free_shipping: product.freeShipping,
  id: product.id,
  image_theme: product.imageTheme,
  image_url: product.imageUrl,
  is_featured: product.isFeatured,
  league: product.league,
  name: product.name,
  price: product.price,
  season_label: product.seasonLabel,
  status: product.status,
  tags: product.tags,
  variant: product.variant,
  year: product.year,
})

export const listStoreProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select(productColumns)
    .order('created_at', { ascending: false })
    .returns<ProductRow[]>()

  if (error || !data) {
    return { data: [] as ShopItem[], error }
  }

  return { data: data.map(mapProductRow), error: null }
}

export const upsertStoreProduct = async (product: ShopItem, userId?: string) => {
  const { data, error } = await supabase
    .from('products')
    .upsert(mapProductToRow(product, userId), { onConflict: 'id' })
    .select(productColumns)
    .single<ProductRow>()

  if (error || !data) {
    return { data: null, error }
  }

  return { data: mapProductRow(data), error: null }
}
