import type { ShopItem } from './shopTypes.ts'

const escapeAttribute = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .trim()

export const getProductMediaAttributes = (product: ShopItem) => {
  if (!product.imageUrl?.trim()) {
    return ''
  }

  const safeUrl = escapeAttribute(product.imageUrl)

  return `style="background-image: url('${safeUrl}');"`
}
