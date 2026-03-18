import type { Notice } from '../../shared/types/notice.ts'
import { renderStorefrontShell } from '../../shared/templates/renderStorefrontShell.ts'
import { escapeHtml } from '../../shared/utils/escapeHtml.ts'
import { getProductMediaAttributes } from '../shop/productMedia.ts'
import type { WishlistLineItem } from './wishlistTypes.ts'

type RenderWishlistPageOptions = {
  actionButton: {
    id: string
    isActive: boolean
    label: string
  }
  lines: WishlistLineItem[]
  notice: Notice | null
}

const formatCurrency = (value: number) => `R ${value}`

const renderNotice = (notice: Notice | null) => {
  if (!notice) {
    return ''
  }

  return `
    <div class="notice notice-${notice.tone}" role="status" aria-live="polite">
      ${escapeHtml(notice.message)}
    </div>
  `
}

const renderWishlistItem = (line: WishlistLineItem) => `
  <article class="wishlist-item">
    <div class="wishlist-item-main">
      <div class="wishlist-item-media ${line.product.imageTheme}" ${getProductMediaAttributes(line.product)}></div>
      <div class="wishlist-item-copy">
        <h2>${escapeHtml(line.product.name)}</h2>
        <p>${escapeHtml(line.product.seasonLabel)}</p>
        <p>Size: <strong>${line.size}</strong></p>
        <strong class="wishlist-item-price">${formatCurrency(line.product.price)}</strong>
        <div class="wishlist-item-actions">
          <button
            class="wishlist-action-button"
            type="button"
            data-wishlist-add-to-cart="${escapeHtml(line.lineId)}"
          >
            Add to Cart
          </button>
          <button
            class="wishlist-action-button"
            type="button"
            data-wishlist-remove="${escapeHtml(line.lineId)}"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  </article>
`

export const renderWishlistPage = ({
  actionButton,
  lines,
  notice,
}: RenderWishlistPageOptions) => {
  const mainContent = `
    <section class="wishlist-page">
      <div class="wishlist-breadcrumb">Home / Wishlist</div>
      <div class="wishlist-heading">
        <h1>Wishlist</h1>
      </div>

      ${renderNotice(notice)}

      <section class="wishlist-card">
        ${
          lines.length
            ? `<div class="wishlist-items">${lines.map(renderWishlistItem).join('')}</div>`
            : `
              <div class="wishlist-empty-state">
                <h2>Your wishlist is empty.</h2>
                <p>Save shirts here and come back to them later.</p>
                <a class="primary-button cart-empty-button" href="#shop">Browse Shop</a>
              </div>
            `
        }
      </section>
    </section>
  `

  return renderStorefrontShell({
    actionButton,
    activeNavHref: '#wishlist',
    mainContent,
    pageContentClass: 'page-content-wishlist',
  })
}
