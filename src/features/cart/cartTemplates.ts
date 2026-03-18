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
    <div class="cart-item-main">
      <div class="cart-item-media ${line.product.imageTheme}" ${getProductMediaAttributes(line.product)}></div>
      <div class="cart-item-copy">
        <h2>${escapeHtml(line.product.name)}</h2>
        <p>${escapeHtml(line.product.seasonLabel)}</p>
        <p>Size: <strong>${line.size}</strong></p>
        <button class="cart-item-remove" type="button" data-cart-remove="${escapeHtml(line.lineId)}">
          Remove
        </button>
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
