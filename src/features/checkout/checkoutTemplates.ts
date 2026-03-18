import { renderStorefrontShell } from '../../shared/templates/renderStorefrontShell.ts'
import { escapeHtml } from '../../shared/utils/escapeHtml.ts'
import { getProductMediaAttributes } from '../shop/productMedia.ts'
import type { RenderCheckoutPageOptions } from './checkoutTypes.ts'

const formatCurrency = (value: number) => `R ${value}`

const renderNotice = (message: RenderCheckoutPageOptions['notice']) => {
  if (!message) {
    return ''
  }

  return `
    <div class="notice notice-${message.tone}" role="status" aria-live="polite">
      ${escapeHtml(message.message)}
    </div>
  `
}

export const renderCheckoutPage = ({
  actionButton,
  customer,
  form,
  lines,
  notice,
  shipping,
  subtotal,
  total,
}: RenderCheckoutPageOptions) => {
  const mainContent = `
    <section class="checkout-page">
      <div class="checkout-heading">
        <h1>Checkout</h1>
      </div>

      ${renderNotice(notice)}

      <div class="checkout-layout">
        <div class="checkout-main">
          <section class="checkout-card">
            <div class="checkout-card-header">
              <h2>Customer Information</h2>
              <button id="checkout-edit-profile" class="checkout-inline-button" type="button">Edit</button>
            </div>
            <div class="checkout-customer-copy">
              <strong>${escapeHtml(customer.name)}</strong>
              <p>${escapeHtml(customer.email)}</p>
            </div>
            <div class="checkout-divider"></div>
            <div class="checkout-address-preview">
              <strong>Shipping Address</strong>
              <p>
                ${
                  form.shippingAddress.trim()
                    ? escapeHtml(form.shippingAddress)
                    : 'Please add your delivery address below before ordering.'
                }
              </p>
            </div>
          </section>

          <section class="checkout-card">
            <h2>Shipping Method</h2>
            <label class="checkout-method">
              <input type="checkbox" checked disabled />
              <span>Nationwide Shipping in South Africa (${formatCurrency(shipping)}, 3-7 business days)</span>
            </label>
          </section>

          <section class="checkout-card">
            <h2>Payment Information</h2>
            <div class="checkout-payment-pill">Yoco Secure Checkout</div>
            <p class="checkout-payment-copy">
              Yoco is the only payment method available. You will be redirected to
              <strong> pay.yoco.com/corediski </strong>
              to complete payment securely.
            </p>

            <form id="checkout-form" class="checkout-form">
              <label class="field field-full">
                <span>Shipping address</span>
                <textarea
                  id="checkout-shipping-address"
                  class="profile-textarea"
                  rows="4"
                >${escapeHtml(form.shippingAddress)}</textarea>
              </label>

              <label class="checkout-checkbox">
                <input
                  id="checkout-billing-same"
                  type="checkbox"
                  ${form.billingSameAsShipping ? 'checked' : ''}
                />
                <span>Billing address same as shipping</span>
              </label>

              <label class="field field-full">
                <span>Billing address</span>
                <textarea
                  id="checkout-billing-address"
                  class="profile-textarea"
                  rows="4"
                  ${form.billingSameAsShipping ? 'disabled' : ''}
                >${escapeHtml(form.billingSameAsShipping ? form.shippingAddress : form.billingAddress)}</textarea>
              </label>

              <button class="primary-button checkout-submit" type="submit">Continue to Yoco</button>
            </form>
          </section>
        </div>

        <aside class="checkout-sidebar">
          <section class="checkout-card checkout-summary-card">
            <h2>Order Summary</h2>
            <div class="checkout-summary-items">
              ${lines
                .map(
                  (line) => `
                    <article class="checkout-summary-item">
                      <div class="checkout-summary-media ${line.product.imageTheme}" ${getProductMediaAttributes(line.product)}></div>
                      <div class="checkout-summary-copy">
                        <strong>${escapeHtml(line.product.name)}</strong>
                        <span>${escapeHtml(line.product.seasonLabel)}</span>
                        <span>Size: ${line.size} · Qty: ${line.quantity}</span>
                      </div>
                      <strong class="checkout-summary-price">${formatCurrency(line.subtotal)}</strong>
                    </article>
                  `,
                )
                .join('')}
            </div>

            <div class="checkout-summary-row">
              <span>Subtotal:</span>
              <strong>${formatCurrency(subtotal)}</strong>
            </div>
            <div class="checkout-summary-row">
              <span>Shipping:</span>
              <strong>${formatCurrency(shipping)}</strong>
            </div>
            <div class="checkout-summary-row checkout-summary-total">
              <span>Total:</span>
              <strong>${formatCurrency(total)}</strong>
            </div>
          </section>
        </aside>
      </div>
    </section>
  `

  return renderStorefrontShell({
    actionButton,
    activeNavHref: '#cart',
    mainContent,
    pageContentClass: 'page-content-checkout',
  })
}
