import { renderStorefrontShell } from '../../shared/templates/renderStorefrontShell.ts'
import { escapeHtml } from '../../shared/utils/escapeHtml.ts'
import { shopCatalog } from '../shop/shopCatalog.ts'
import { getProductMediaAttributes } from '../shop/productMedia.ts'
import type { ShirtSize, ShopItem } from '../shop/shopTypes.ts'

type RenderProductPageOptions = {
  actionButton: {
    id: string
    isActive: boolean
    label: string
  }
  isWishlisted: boolean
  product: ShopItem
  selectedSize: ShirtSize
}

const heartIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5A4.5 4.5 0 0 1 6.5 4C8.24 4 9.91 4.81 11 6.09 12.09 4.81 13.76 4 15.5 4A4.5 4.5 0 0 1 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z" fill="none" stroke="currentColor" stroke-width="1.8" />
  </svg>
`

const getRelatedItems = (product: ShopItem) =>
  shopCatalog.filter((item) => item.id !== product.id).slice(0, 4)

const renderRelatedCard = (item: ShopItem) => `
  <button class="related-card" type="button" data-product-id="${escapeHtml(item.id)}">
    <div class="related-card-media ${item.imageTheme}" ${getProductMediaAttributes(item)}></div>
    <div class="related-card-copy">
      <span>${escapeHtml(item.name)}</span>
      <strong>${escapeHtml(item.seasonLabel)}</strong>
    </div>
  </button>
`

export const renderProductPage = ({
  actionButton,
  isWishlisted,
  product,
  selectedSize,
}: RenderProductPageOptions) => {
  const relatedItems = getRelatedItems(product)

  const mainContent = `
    <section class="product-page">
      <div class="product-breadcrumb">
        Home / ${escapeHtml(product.name)} / ${escapeHtml(product.name)} ${escapeHtml(product.seasonLabel)} Shirt
      </div>

      <div class="product-layout">
        <div class="product-gallery">
          <div class="product-main-image ${product.imageTheme}" ${getProductMediaAttributes(product)}></div>
          <div class="product-thumbnails">
            <button class="product-thumb ${product.imageTheme}" ${getProductMediaAttributes(product)} type="button" aria-label="View image 1"></button>
            <button class="product-thumb ${product.imageTheme}" ${getProductMediaAttributes(product)} type="button" aria-label="View image 2"></button>
            <button class="product-thumb ${product.imageTheme}" ${getProductMediaAttributes(product)} type="button" aria-label="View image 3"></button>
            <button class="product-thumb ${product.imageTheme}" ${getProductMediaAttributes(product)} type="button" aria-label="View image 4"></button>
          </div>
        </div>

        <section class="product-summary">
          <h1>${escapeHtml(product.name)}</h1>
          <h2>${escapeHtml(product.seasonLabel)} Shirt</h2>

          <dl class="product-meta">
            <div><dt>Season:</dt><dd>${escapeHtml(product.seasonLabel.replace(' Home', '').replace(' Shirt', ''))}</dd></div>
            <div><dt>League:</dt><dd>${escapeHtml(product.league)}</dd></div>
            <div><dt>Condition:</dt><dd>${escapeHtml(product.condition)}</dd></div>
            <div><dt>Authenticity:</dt><dd>${escapeHtml(product.authenticity)}</dd></div>
          </dl>

          <div class="product-divider"></div>

          <div class="product-price">R ${product.price}</div>
          <p class="product-shipping">${product.freeShipping ? 'Free worldwide shipping' : 'Shipping calculated at checkout'}</p>

          <div class="product-sizes">
            <span>Size:</span>
            <div class="product-size-list">
              ${product.availableSizes
                .map(
                  (size) => `
                    <button
                      class="product-size-button ${size === selectedSize ? 'is-active' : ''}"
                      type="button"
                      data-size="${size}"
                    >
                      ${size}
                    </button>
                  `,
                )
                .join('')}
            </div>
            <small>Selected size: ${selectedSize}</small>
          </div>

          <button id="product-add-to-cart" class="product-primary-action" type="button">Add To Cart</button>
          <button
            id="product-add-to-wishlist"
            class="product-secondary-action ${isWishlisted ? 'is-active' : ''}"
            type="button"
          >
            <span class="product-secondary-icon">${heartIcon}</span>
            ${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          </button>
        </section>
      </div>

      <div class="product-detail-sections">
        <section class="product-description">
          <h3>Description</h3>
          <p>${escapeHtml(product.description)}</p>
          <p><strong>Verified Authentic:</strong> Each jersey is professionally inspected and authenticated before listing.</p>
        </section>

        <div class="product-description-image ${product.imageTheme}" ${getProductMediaAttributes(product)}></div>
      </div>

      <section class="product-related">
        <h3>You May Also Like</h3>
        <div class="product-related-grid">
          ${relatedItems.map(renderRelatedCard).join('')}
        </div>
      </section>
    </section>
  `

  return renderStorefrontShell({
    actionButton,
    activeNavHref: '#shop',
    mainContent,
    pageContentClass: 'page-content-product',
  })
}
