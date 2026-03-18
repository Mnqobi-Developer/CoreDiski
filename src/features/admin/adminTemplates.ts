import { brandLogoSrc } from '../../config/site.ts'
import { escapeHtml } from '../../shared/utils/escapeHtml.ts'
import { getProductMediaAttributes } from '../shop/productMedia.ts'
import type { ShopItem } from '../shop/shopTypes.ts'
import type { AdminProductForm, AdminState, AdminView, AdminDashboardData } from './adminTypes.ts'

type RenderAdminPageOptions = {
  data: AdminDashboardData
  searchTerm: string
  state: AdminState
}

const formatCurrency = (value: number) => `R ${value}`

const renderNotice = (notice: AdminState['notice']) => {
  if (!notice) {
    return ''
  }

  return `
    <div class="notice notice-${notice.tone}" role="status" aria-live="polite">
      ${escapeHtml(notice.message)}
    </div>
  `
}

const renderSidebarLink = (id: string, label: string, active: boolean) =>
  `<button id="${id}" class="admin-sidebar-link ${active ? 'is-active' : ''}" type="button">${label}</button>`

const renderRecentProducts = (products: AdminDashboardData['recentProducts']) => {
  if (!products.length) {
    return '<p class="admin-empty-copy">No products found.</p>'
  }

  return `
    <div class="admin-table">
      <div class="admin-table-head">
        <span>Product</span>
        <span>Price</span>
        <span>Type</span>
        <span>Status</span>
      </div>
      ${products
        .map(
          (product) => `
            <div class="admin-table-row">
              <div>
                <strong>${escapeHtml(product.name)}</strong>
                <span>${escapeHtml(product.seasonLabel)}</span>
              </div>
              <span>${formatCurrency(product.price)}</span>
              <span class="admin-pill">${product.isFeatured ? 'Featured' : 'Standard'}</span>
              <span class="admin-pill">${escapeHtml(product.status)}</span>
            </div>
          `,
        )
        .join('')}
    </div>
  `
}

const renderRecentOrders = (orders: AdminDashboardData['recentOrders']) => {
  if (!orders.length) {
    return '<p class="admin-empty-copy">No orders yet.</p>'
  }

  return `
    <div class="admin-list">
      ${orders
        .map(
          (order) => `
            <article class="admin-list-row">
              <div>
                <strong>${escapeHtml(order.id)}</strong>
                <span>${escapeHtml(order.email)}</span>
              </div>
              <div>
                <strong>${formatCurrency(order.total)}</strong>
                <span>${escapeHtml(order.status)}</span>
              </div>
            </article>
          `,
        )
        .join('')}
    </div>
  `
}

const renderCustomers = (customers: AdminDashboardData['customers']) => {
  if (!customers.length) {
    return '<p class="admin-empty-copy">No customers yet.</p>'
  }

  return `
    <div class="admin-list">
      ${customers
        .map(
          (customer) => `
            <article class="admin-list-row">
              <div>
                <strong>${escapeHtml(customer.email)}</strong>
                <span>${escapeHtml(customer.userId)}</span>
              </div>
              <div>
                <strong>${customer.orders}</strong>
                <span>order${customer.orders === 1 ? '' : 's'}</span>
              </div>
            </article>
          `,
        )
        .join('')}
    </div>
  `
}

const renderCategories = (categories: AdminDashboardData['categories']) => {
  if (!categories.length) {
    return '<p class="admin-empty-copy">No categories found.</p>'
  }

  return `
    <div class="admin-category-grid">
      ${categories
        .map(
          (category) => `
            <article class="admin-category-card">
              <strong>${escapeHtml(category.label)}</strong>
              <span>${category.count} product${category.count === 1 ? '' : 's'}</span>
            </article>
          `,
        )
        .join('')}
    </div>
  `
}

const renderProductRow = (product: ShopItem) => `
  <div class="admin-product-row">
    <div class="admin-product-cell admin-product-main">
      <div class="admin-product-thumb ${product.imageTheme}" ${getProductMediaAttributes(product)}></div>
      <div class="admin-product-copy">
        <strong>${escapeHtml(product.name)}</strong>
        <span>${escapeHtml(product.clubOrNation)} · ${escapeHtml(product.variant)}</span>
      </div>
    </div>
    <div class="admin-product-cell">${escapeHtml(product.seasonLabel.replace(` ${product.variant}`, ''))}</div>
    <div class="admin-product-cell">${formatCurrency(product.price)}</div>
    <div class="admin-product-cell">${escapeHtml(product.tags.join(', '))}</div>
    <div class="admin-product-cell"><span class="admin-pill">${product.isFeatured ? 'Yes' : 'No'}</span></div>
    <div class="admin-product-cell">
      <button class="admin-edit-button" type="button" data-admin-edit-product="${escapeHtml(product.id)}">Edit</button>
    </div>
  </div>
`

const renderProductsPage = (
  products: ShopItem[],
  form: AdminProductForm,
  editingProductId: string | null,
  notice: AdminState['notice'],
  searchTerm: string,
) => `
  <section class="admin-page-header">
    <input
      id="admin-search-input"
      class="admin-search-input"
      type="search"
      value="${escapeHtml(searchTerm)}"
      placeholder="Search..."
    />
    <div class="admin-page-label">Products</div>
  </section>

  <section class="admin-heading-block">
    <h1>Products</h1>
  </section>

  ${renderNotice(notice)}

  <section id="admin-products-form-section" class="admin-panel admin-panel-wide">
    <h2>${editingProductId ? 'Edit Product' : 'Add New Product'}</h2>
    <p class="admin-empty-copy admin-panel-copy">
      Enter all football shirt details below. You can create a new product or edit an existing one.
    </p>

    <form id="admin-product-form" class="admin-product-form">
      <div class="admin-product-form-grid">
        <label class="field">
          <span>Club or Nation</span>
          <input id="admin-club-or-nation" type="text" value="${escapeHtml(form.clubOrNation)}" />
        </label>
        <label class="field">
          <span>Product Title</span>
          <input id="admin-product-title" type="text" value="${escapeHtml(form.productTitle)}" />
        </label>
        <label class="field">
          <span>Season</span>
          <input id="admin-season" type="text" value="${escapeHtml(form.season)}" placeholder="e.g. 1998-1999" />
        </label>
        <label class="field">
          <span>Variant</span>
          <input id="admin-variant" type="text" value="${escapeHtml(form.variant)}" placeholder="Home / Away / Third" />
        </label>
        <label class="field">
          <span>Price (ZAR)</span>
          <input id="admin-price" type="number" min="1" step="1" value="${escapeHtml(form.price)}" />
        </label>
        <label class="field">
          <span>Image URL</span>
          <input id="admin-image-url" type="url" value="${escapeHtml(form.imageUrl)}" placeholder="https://..." />
        </label>
      </div>

      <label class="field field-full">
        <span>Tags (comma-separated)</span>
        <input id="admin-tags" type="text" value="${escapeHtml(form.tags)}" placeholder="retro, classic, premier league" />
      </label>

      <label class="admin-checkbox">
        <input id="admin-featured" type="checkbox" ${form.isFeatured ? 'checked' : ''} />
        <span>Mark as featured</span>
      </label>

      <div class="admin-product-form-actions">
        <button class="primary-button admin-add-button" type="submit">${editingProductId ? 'Save Product' : 'Add Product'}</button>
        ${
          editingProductId
            ? '<button id="admin-cancel-edit" class="cart-secondary-button admin-cancel-button" type="button">Cancel</button>'
            : ''
        }
      </div>
    </form>
  </section>

  <section id="admin-products-table-section" class="admin-panel admin-panel-wide">
    <h2>Available Store Products</h2>
    <p class="admin-empty-copy admin-panel-copy">All products currently in the storefront are listed below.</p>
    ${
      products.length
        ? `
          <div class="admin-products-table">
            <div class="admin-product-table-head">
              <span>Product</span>
              <span>Season</span>
              <span>Price</span>
              <span>Tags</span>
              <span>Featured</span>
              <span>Action</span>
            </div>
            ${products.map(renderProductRow).join('')}
          </div>
        `
        : '<p class="admin-empty-copy">No products found.</p>'
    }
  </section>
`

const renderDashboardPage = (data: AdminDashboardData, searchTerm: string) => `
  <section id="admin-dashboard-section" class="admin-page-header">
    <input
      id="admin-search-input"
      class="admin-search-input"
      type="search"
      value="${escapeHtml(searchTerm)}"
      placeholder="Search..."
    />
    <div class="admin-page-label">Dashboard</div>
  </section>

  <section class="admin-heading-block">
    <h1>Dashboard</h1>
  </section>

  <section class="admin-stats-grid">
    <article class="admin-stat-card">
      <h2>Total Products</h2>
      <strong>${data.stats.totalProducts}</strong>
    </article>
    <article class="admin-stat-card">
      <h2>Total Orders</h2>
      <strong>${data.stats.totalOrders}</strong>
    </article>
    <article class="admin-stat-card">
      <h2>Total Customers</h2>
      <strong>${data.stats.totalCustomers}</strong>
    </article>
    <article class="admin-stat-card">
      <h2>Out of Stock</h2>
      <strong>${data.stats.outOfStock}</strong>
    </article>
  </section>

  <section id="admin-products-section" class="admin-panel admin-panel-wide">
    <h2>Recent Products</h2>
    ${renderRecentProducts(data.recentProducts)}
  </section>

  <section class="admin-bottom-grid">
    <section id="admin-orders-section" class="admin-panel">
      <h2>Recent Orders</h2>
      ${renderRecentOrders(data.recentOrders)}
    </section>

    <section id="admin-analytics-section" class="admin-panel">
      <h2>Order Status</h2>
      <div class="admin-status-list">
        <div class="admin-status-row"><span>Pending</span><strong>${data.orderSummary.pending}</strong></div>
        <div class="admin-status-row"><span>Shipped</span><strong>${data.orderSummary.shipped}</strong></div>
        <div class="admin-status-row"><span>Completed</span><strong>${data.orderSummary.completed}</strong></div>
      </div>
    </section>
  </section>

  <section class="admin-bottom-grid">
    <section id="admin-customers-section" class="admin-panel">
      <h2>Customers</h2>
      ${renderCustomers(data.customers)}
    </section>

    <section id="admin-categories-section" class="admin-panel">
      <h2>Categories</h2>
      ${renderCategories(data.categories)}
    </section>
  </section>

  <section id="admin-settings-section" class="admin-panel admin-panel-wide">
    <h2>Settings</h2>
    <p class="admin-empty-copy">Admin-only access is active. Product, order, and customer management can be extended from this dashboard.</p>
  </section>
`

export const renderAdminPage = ({ data, searchTerm, state }: RenderAdminPageOptions) => {
  const activeView: AdminView = state.activeView

  return `
    <div class="admin-shell">
      <header class="admin-topbar">
        <div class="admin-brand">
          <img class="admin-brand-logo" src="${brandLogoSrc}" alt="Core Diski logo" />
          <div>
            <p class="admin-brand-title">CORE DISKI</p>
            <p class="admin-brand-subtitle">Admin Portal</p>
          </div>
        </div>

        <nav class="admin-topnav" aria-label="Admin Navigation">
          <button id="admin-home" class="admin-topnav-button is-active" type="button">Home</button>
          <button id="admin-storefront" class="admin-topnav-button" type="button">Storefront</button>
          <button id="admin-signout" class="admin-topnav-button" type="button">Sign Out</button>
        </nav>
      </header>

      <div class="admin-layout">
        <aside class="admin-sidebar">
          <nav class="admin-sidebar-nav">
            ${renderSidebarLink('admin-nav-dashboard', 'Dashboard', activeView === 'dashboard')}
            ${renderSidebarLink('admin-nav-products', 'Products', activeView === 'products')}
            ${renderSidebarLink('admin-nav-orders', 'Orders', false)}
            ${renderSidebarLink('admin-nav-customers', 'Customers', false)}
            ${renderSidebarLink('admin-nav-categories', 'Categories', false)}
            ${renderSidebarLink('admin-nav-analytics', 'Analytics', false)}
            ${renderSidebarLink('admin-nav-settings', 'Settings', false)}
          </nav>

          <div class="admin-sidebar-footer">
            <button id="admin-sidebar-home" class="admin-sidebar-utility" type="button">Home</button>
            <button id="admin-sidebar-storefront" class="admin-sidebar-utility" type="button">Main Website</button>
            <button id="admin-sidebar-support" class="admin-sidebar-utility" type="button">Contact Support</button>
          </div>
        </aside>

        <main class="admin-content">
          ${
            activeView === 'products'
              ? renderProductsPage(data.filteredProducts, state.form, state.editingProductId, state.notice, searchTerm)
              : renderDashboardPage(data, searchTerm)
          }
        </main>
      </div>
    </div>
  `
}
