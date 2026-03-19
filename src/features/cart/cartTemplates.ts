import { renderStorefrontShell } from '../../shared/templates/renderStorefrontShell.ts'
import { escapeHtml } from '../../shared/utils/escapeHtml.ts'
import type { Notice } from '../../shared/types/notice.ts'
import { getProductMediaAttributes } from '../shop/productMedia.ts'
import type { CartLineItem } from './cartTypes.ts'

type RenderCartPageOptions = {
  actionButton: {
    id: string
    isActive: boolean
    label: string
  }
  lines: CartLineItem[]
  notice: Notice | null
  shipping: number
  subtotal: number
  total: number
}

const formatCurrency = (value: number) => `R ${value}`

const trashIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M9 3.75h6a1.5 1.5 0 0 1 1.5 1.5v.75H20a.75.75 0 0 1 0 1.5h-1.02l-.73 10.12A2.25 2.25 0 0 1 16 19.75H8a2.25 2.25 0 0 1-2.24-2.13L5.03 7.5H4a.75.75 0 0 1 0-1.5h3.5v-.75A1.5 1.5 0 0 1 9 3.75Zm6 2.25v-.75H9V6h6Zm-7.73 1.5.73 10.02a.75.75 0 0 0 .75.73H16a.75.75 0 0 0 .75-.73l.72-10.02H7.27Zm2.98 2.25a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1 .75-.75Zm3.5 0a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1 .75-.75Z"
      fill="currentColor"
    />
  </svg>
`

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

const renderCartItem = (line: CartLineItem) => `
  <article class="cart-item">
    <button
      class="cart-item-remove"
      type="button"
      data-cart-remove="${escapeHtml(line.lineId)}"
      aria-label="Remove ${escapeHtml(line.product.name)} from cart"
    >
      ${trashIcon}
    </button>

    <div class="cart-item-main">
      <div class="cart-item-media ${line.product.imageTheme}" ${getProductMediaAttributes(line.product)}></div>
      <div class="cart-item-copy">
        <h2>${escapeHtml(line.product.name)}</h2>
        <p>${escapeHtml(line.product.seasonLabel)}</p>
        <p>Size: <strong>${line.size}</strong></p>
      </div>
    </div>

    <div class="cart-item-actions">
      <strong class="cart-item-price">${formatCurrency(line.subtotal)}</strong>
      <div class="cart-quantity">
        <button type="button" data-cart-decrease="${escapeHtml(line.lineId)}">-</button>
        <span>${line.quantity}</span>
        <button type="button" data-cart-increase="${escapeHtml(line.lineId)}">+</button>
      </div>
    </div>
  </article>
`

export const renderCartPage = ({
  actionButton,
  lines,
  notice,
  shipping,
  subtotal,
  total,
}: RenderCartPageOptions) => {
  const mainContent = `
    <section class="cart-page">
      <div class="cart-breadcrumb">Home / Shopping Cart</div>
      <div class="cart-heading">
        <h1>Shopping Cart</h1>
      </div>

      ${renderNotice(notice)}

      <section class="cart-card ${lines.length ? '' : 'cart-card-empty'}">
        ${
          lines.length
            ? `
              <div class="cart-items">
                ${lines.map(renderCartItem).join('')}
              </div>

              <aside class="cart-summary">
                <div class="cart-summary-card">
                  <div class="cart-summary-row">
                    <span>Subtotal</span>
                    <strong>${formatCurrency(subtotal)}</strong>
                  </div>
                  <div class="cart-summary-row">
                    <span>Shipping</span>
                    <strong>${formatCurrency(shipping)}</strong>
                  </div>
                  <div class="cart-summary-row cart-summary-total">
                    <span>Total</span>
                    <strong>${formatCurrency(total)}</strong>
                  </div>

                  <button id="cart-checkout" class="primary-button cart-primary-button" type="button">
                    Proceed to Checkout
                  </button>
                  <button id="cart-clear" class="cart-secondary-button" type="button">
                    Clear Cart
                  </button>
                </div>
              </aside>
            `
            : `
              <div class="cart-empty-state">
                <h2>Your cart is empty.</h2>
                <p>Add a shirt from the shop to continue to checkout.</p>
                <a class="primary-button cart-empty-button" href="#shop">Browse Shop</a>
              </div>
            `
        }
      </section>
    </section>
  `

  return renderStorefrontShell({
    actionButton,
    activeNavHref: '#cart',
    mainContent,
    pageContentClass: 'page-content-cart',
  })
}
