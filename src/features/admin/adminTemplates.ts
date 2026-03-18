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

const formatJoinedDate = (isoDate: string) =>
  new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoDate))

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
                <span>${escapeHtml(order.paymentStatus === 'paid' ? order.status : 'awaiting approval')}</span>
              </div>
            </article>
          `,
        )
        .join('')}
    </div>
  `
}

const renderOrdersPage = (
  orders: AdminDashboardData['filteredOrders'],
  state: AdminState,
  data: AdminDashboardData,
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
    <div class="admin-page-label">Orders</div>
  </section>

  <section class="admin-heading-block">
    <h1>Orders</h1>
  </section>

  ${renderNotice(state.notice)}

  <section class="admin-stats-grid">
    <article class="admin-stat-card">
      <h2>Total Orders</h2>
      <strong>${data.stats.totalOrders}</strong>
    </article>
    <article class="admin-stat-card">
      <h2>Paid Orders</h2>
      <strong>${data.totalPaidOrders}</strong>
    </article>
    <article class="admin-stat-card">
      <h2>Pending Orders</h2>
      <strong>${data.totalPendingApprovalOrders}</strong>
    </article>
    <article class="admin-stat-card">
      <h2>Avg. Order Value</h2>
      <strong>${formatCurrency(data.averagePaidOrderValue)}</strong>
    </article>
  </section>

  <section id="admin-orders-section" class="admin-panel admin-panel-wide">
    <h2>Order Management</h2>
    <p class="admin-empty-copy admin-panel-copy">
      Filter, review, and update payment status for all store orders.
    </p>

    <form id="admin-order-filter-form" class="admin-order-toolbar">
      <input
        id="admin-order-search-input"
        class="admin-search-input"
        type="search"
        value="${escapeHtml(searchTerm)}"
        placeholder="Search by order #, customer, email, or address..."
      />

      <label class="shop-select-wrap">
        <select id="admin-order-status-filter" class="shop-select">
          <option value="all" ${state.orderFilter === 'all' ? 'selected' : ''}>All Statuses</option>
          <option value="awaiting_approval" ${state.orderFilter === 'awaiting_approval' ? 'selected' : ''}>Awaiting Approval</option>
          <option value="paid" ${state.orderFilter === 'paid' ? 'selected' : ''}>Paid</option>
        </select>
      </label>

      <button class="admin-edit-button" type="submit">Apply</button>
    </form>

    ${
      orders.length
        ? `
          <div class="admin-orders-table">
            <div class="admin-order-table-head">
              <span>Order</span>
              <span>Customer</span>
              <span>Items</span>
              <span>Total</span>
              <span>Status</span>
              <span>Date</span>
              <span>Action</span>
            </div>
            ${orders
              .map(
                (order) => `
                  <div class="admin-order-row">
                    <div class="admin-order-cell">
                      <strong>${escapeHtml(order.id)}</strong>
                      <span>${escapeHtml(order.shippingAddress)}</span>
                    </div>
                    <div class="admin-order-cell">
                      <strong>${escapeHtml(order.email)}</strong>
                      <span>${escapeHtml(order.userId)}</span>
                    </div>
                    <div class="admin-order-cell">${order.items.length}</div>
                    <div class="admin-order-cell">${formatCurrency(order.total)}</div>
                    <div class="admin-order-cell">
                      <span class="admin-pill">${order.paymentStatus === 'paid' ? 'Paid' : 'Awaiting Approval'}</span>
                    </div>
                    <div class="admin-order-cell">${escapeHtml(new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(order.createdAt)))}</div>
                    <div class="admin-order-cell">
                      ${
                        order.paymentStatus === 'awaiting_approval'
                          ? `<button class="admin-edit-button" type="button" data-admin-approve-order="${escapeHtml(order.id)}">Approve Payment</button>`
                          : order.status === 'pending'
                            ? `<button class="admin-edit-button" type="button" data-admin-ship-order="${escapeHtml(order.id)}">Mark Shipped</button>`
                            : order.status === 'shipped'
                              ? `<button class="admin-edit-button" type="button" data-admin-complete-order="${escapeHtml(order.id)}">Mark Completed</button>`
                              : `<span class="admin-empty-copy admin-inline-copy">No action</span>`
                      }
                    </div>
                  </div>
                `,
              )
              .join('')}
          </div>
        `
        : '<p class="admin-empty-copy">No orders match your current filters.</p>'
    }
  </section>
`

const renderCustomersPage = (
  customers: AdminDashboardData['filteredCustomers'],
  state: AdminState,
  data: AdminDashboardData,
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
    <div class="admin-page-label">Customers</div>
  </section>

  <section class="admin-heading-block">
    <h1>Customers</h1>
  </section>

  ${renderNotice(state.notice)}

  <section class="admin-stats-grid">
    <article class="admin-stat-card">
      <h2>Total Accounts</h2>
      <strong>${data.customerStats.totalAccounts}</strong>
    </article>
    <article class="admin-stat-card">
      <h2>Admins</h2>
      <strong>${data.customerStats.admins}</strong>
    </article>
    <article class="admin-stat-card">
      <h2>Customers</h2>
      <strong>${data.customerStats.customers}</strong>
    </article>
    <article class="admin-stat-card">
      <h2>Profiles Completed</h2>
      <strong>${data.customerStats.profilesCompleted}</strong>
    </article>
  </section>

  <section id="admin-customers-section" class="admin-panel admin-panel-wide">
    <h2>Customer Accounts</h2>
    <p class="admin-empty-copy admin-panel-copy">
      View all registered accounts, search and filter users, promote or demote admins, and remove accounts.
    </p>

    <form id="admin-customer-filter-form" class="admin-customer-toolbar">
      <input
        id="admin-customer-search-input"
        class="admin-search-input"
        type="search"
        value="${escapeHtml(searchTerm)}"
        placeholder="Search name, email, phone, address..."
      />

      <label class="shop-select-wrap">
        <select id="admin-customer-role-filter" class="shop-select">
          <option value="all" ${state.customerFilter === 'all' ? 'selected' : ''}>All Roles</option>
          <option value="admin" ${state.customerFilter === 'admin' ? 'selected' : ''}>Admins</option>
          <option value="customer" ${state.customerFilter === 'customer' ? 'selected' : ''}>Customers</option>
        </select>
      </label>

      <button class="admin-edit-button" type="submit">Apply</button>
    </form>

    ${
      customers.length
        ? `
          <div class="admin-customers-table">
            <div class="admin-customer-table-head">
              <span>Name</span>
              <span>Email</span>
              <span>Phone</span>
              <span>Address</span>
              <span>Role</span>
              <span>Joined</span>
              <span>Actions</span>
            </div>
            ${customers
              .map(
                (customer) => `
                  <div class="admin-customer-row">
                    <div class="admin-customer-cell">
                      <strong>${escapeHtml(customer.fullName || 'Customer')}</strong>
                    </div>
                    <div class="admin-customer-cell">${escapeHtml(customer.email)}</div>
                    <div class="admin-customer-cell">${customer.phone ? escapeHtml(customer.phone) : '&mdash;'}</div>
                    <div class="admin-customer-cell">${customer.address ? escapeHtml(customer.address) : '&mdash;'}</div>
                    <div class="admin-customer-cell">
                      <span class="admin-pill ${customer.role === 'admin' ? 'admin-pill-admin' : 'admin-pill-customer'}">
                        ${customer.role === 'admin' ? 'Admin' : 'Customer'}
                      </span>
                    </div>
                    <div class="admin-customer-cell">${escapeHtml(formatJoinedDate(customer.createdAt))}</div>
                    <div class="admin-customer-cell admin-customer-actions">
                      ${
                        customer.role === 'admin'
                          ? `<button class="admin-edit-button" type="button" data-admin-demote-customer="${escapeHtml(customer.id)}">Demote</button>`
                          : `<button class="admin-edit-button" type="button" data-admin-promote-customer="${escapeHtml(customer.id)}">Promote</button>`
                      }
                      <button class="admin-remove-button" type="button" data-admin-remove-customer="${escapeHtml(customer.id)}">Remove</button>
                    </div>
                  </div>
                `,
              )
              .join('')}
          </div>
        `
        : '<p class="admin-empty-copy">No customer accounts match your current filters.</p>'
    }
  </section>
`

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

const renderAnalyticsPage = (data: AdminDashboardData, state: AdminState, searchTerm: string) => `
  <section class="admin-page-header">
    <input
      id="admin-search-input"
      class="admin-search-input"
      type="search"
      value="${escapeHtml(searchTerm)}"
      placeholder="Search..."
    />
    <div class="admin-page-label">Analytics</div>
  </section>

  <section class="admin-heading-block">
    <h1>Analytics</h1>
  </section>

  ${renderNotice(state.notice)}

  <section class="admin-stats-grid">
    <article class="admin-stat-card">
      <h2>Total Revenue</h2>
      <strong>${formatCurrency(data.analytics.totalRevenue)}</strong>
    </article>
    <article class="admin-stat-card">
      <h2>Paid Revenue</h2>
      <strong>${formatCurrency(data.analytics.paidRevenue)}</strong>
    </article>
    <article class="admin-stat-card">
      <h2>Average Order Value</h2>
      <strong>${formatCurrency(data.analytics.averageOrderValue)}</strong>
    </article>
    <article class="admin-stat-card">
      <h2>Order Conversion</h2>
      <strong>${data.analytics.orderConversionRate}%</strong>
    </article>
  </section>

  <section class="admin-panel admin-panel-wide">
    <h2>Top Selling Products</h2>
    <p class="admin-empty-copy admin-panel-copy">
      Track your best performing shirts by units sold and revenue contribution.
    </p>

    <div class="admin-analytics-table">
      <div class="admin-analytics-table-head admin-analytics-products-head">
        <span>Product</span>
        <span>Units Sold</span>
        <span>Revenue</span>
        <span>Performance</span>
      </div>
      ${
        data.analytics.topSellingProducts.length
          ? data.analytics.topSellingProducts
              .map(
                (product) => `
                  <div class="admin-analytics-row admin-analytics-products-row">
                    <div class="admin-analytics-cell">
                      <strong>${escapeHtml(product.title)}</strong>
                    </div>
                    <div class="admin-analytics-cell">${product.unitsSold}</div>
                    <div class="admin-analytics-cell">${formatCurrency(product.revenue)}</div>
                    <div class="admin-analytics-cell">
                      <div class="admin-performance-cell">
                        <div class="admin-performance-track">
                          <span class="admin-performance-fill" style="width: ${product.performancePercent}%"></span>
                        </div>
                        <strong>${product.performancePercent}%</strong>
                      </div>
                    </div>
                  </div>
                `,
              )
              .join('')
          : '<div class="admin-analytics-empty-row">No sales data available yet.</div>'
      }
    </div>
  </section>

  <section class="admin-panel admin-panel-wide">
    <h2>Recent Revenue Activity</h2>
    <p class="admin-empty-copy admin-panel-copy">
      Latest orders and payment status so you can monitor daily cashflow at a glance.
    </p>

    <div class="admin-analytics-table">
      <div class="admin-analytics-table-head admin-analytics-revenue-head">
        <span>Order</span>
        <span>Customer</span>
        <span>Total</span>
        <span>Status</span>
        <span>Date</span>
      </div>
      ${
        data.analytics.recentRevenueActivity.length
          ? data.analytics.recentRevenueActivity
              .map(
                (order) => `
                  <div class="admin-analytics-row admin-analytics-revenue-row">
                    <div class="admin-analytics-cell">
                      <strong>${escapeHtml(order.id)}</strong>
                    </div>
                    <div class="admin-analytics-cell">${escapeHtml(order.email)}</div>
                    <div class="admin-analytics-cell">${formatCurrency(order.total)}</div>
                    <div class="admin-analytics-cell">
                      <span class="admin-pill ${order.paymentStatus === 'paid' ? 'admin-pill-admin' : 'admin-pill-pending'}">
                        ${order.paymentStatus === 'paid' ? 'Paid' : 'Awaiting Approval'}
                      </span>
                    </div>
                    <div class="admin-analytics-cell">${escapeHtml(formatJoinedDate(order.createdAt))}</div>
                  </div>
                `,
              )
              .join('')
          : '<div class="admin-analytics-empty-row">No orders available yet.</div>'
      }
    </div>
  </section>
`

const renderSettingsPage = (data: AdminDashboardData, state: AdminState, searchTerm: string) => `
  <section class="admin-page-header">
    <input
      id="admin-search-input"
      class="admin-search-input"
      type="search"
      value="${escapeHtml(searchTerm)}"
      placeholder="Search..."
    />
    <div class="admin-page-label">Settings</div>
  </section>

  <section class="admin-heading-block">
    <h1>Settings</h1>
  </section>

  ${renderNotice(state.notice)}

  <section class="admin-stats-grid">
    <article class="admin-stat-card">
      <h2>Admin Accounts</h2>
      <strong>${data.customerStats.admins}</strong>
    </article>
    <article class="admin-stat-card">
      <h2>Pending Orders</h2>
      <strong>${data.totalPendingApprovalOrders}</strong>
    </article>
    <article class="admin-stat-card">
      <h2>Tax Rate</h2>
      <strong>${escapeHtml(state.settingsForm.taxRate)}%</strong>
    </article>
    <article class="admin-stat-card">
      <h2>Currency</h2>
      <strong>${escapeHtml(state.settingsForm.currency)}</strong>
    </article>
  </section>

  <section class="admin-panel admin-panel-wide">
    <h2>Store Configuration</h2>
    <p class="admin-empty-copy admin-panel-copy">
      Update core storefront details, checkout defaults, and operational toggles used by administrators.
    </p>

    <form id="admin-settings-form" class="admin-settings-form">
      <div class="admin-settings-grid">
        <label class="field">
          <span>Store Name</span>
          <input id="admin-settings-store-name" type="text" value="${escapeHtml(state.settingsForm.storeName)}" />
        </label>
        <label class="field">
          <span>Support Email</span>
          <input id="admin-settings-support-email" type="email" value="${escapeHtml(state.settingsForm.supportEmail)}" />
        </label>
        <label class="field">
          <span>Support Phone</span>
          <input id="admin-settings-support-phone" type="text" value="${escapeHtml(state.settingsForm.supportPhone)}" />
        </label>
        <label class="field">
          <span>Currency</span>
          <span class="shop-select-wrap">
            <select id="admin-settings-currency" class="shop-select">
              <option value="ZAR" ${state.settingsForm.currency === 'ZAR' ? 'selected' : ''}>ZAR</option>
              <option value="USD" ${state.settingsForm.currency === 'USD' ? 'selected' : ''}>USD</option>
              <option value="EUR" ${state.settingsForm.currency === 'EUR' ? 'selected' : ''}>EUR</option>
              <option value="GBP" ${state.settingsForm.currency === 'GBP' ? 'selected' : ''}>GBP</option>
            </select>
          </span>
        </label>
        <label class="field">
          <span>Tax Rate (%)</span>
          <input id="admin-settings-tax-rate" type="number" min="0" step="0.1" value="${escapeHtml(state.settingsForm.taxRate)}" />
        </label>
        <label class="field">
          <span>Flat Shipping Rate</span>
          <input id="admin-settings-flat-shipping-rate" type="number" min="0" step="1" value="${escapeHtml(state.settingsForm.flatShippingRate)}" />
        </label>
        <label class="field field-full">
          <span>Low Stock Threshold</span>
          <input id="admin-settings-low-stock-threshold" type="number" min="1" step="1" value="${escapeHtml(state.settingsForm.lowStockThreshold)}" />
        </label>
      </div>

      <div class="admin-settings-checkbox-grid">
        <label class="admin-checkbox">
          <input id="admin-settings-send-admin-notifications" type="checkbox" ${state.settingsForm.sendAdminNotifications ? 'checked' : ''} />
          <span>Send admin notifications for new orders</span>
        </label>
        <label class="admin-checkbox">
          <input id="admin-settings-maintenance-mode" type="checkbox" ${state.settingsForm.maintenanceMode ? 'checked' : ''} />
          <span>Maintenance mode (temporarily pause storefront activity)</span>
        </label>
        <label class="admin-checkbox">
          <input id="admin-settings-require-double-opt-in" type="checkbox" ${state.settingsForm.requireNewsletterDoubleOptIn ? 'checked' : ''} />
          <span>Require newsletter double opt-in</span>
        </label>
      </div>

      <div class="admin-settings-footer">
        <p class="admin-settings-meta">Last updated: ${escapeHtml(formatJoinedDate(state.settingsForm.lastUpdatedAt))}</p>
        <div class="admin-settings-actions">
          <button class="primary-button admin-settings-save" type="submit">Save Settings</button>
          <button id="admin-reset-settings" class="cart-secondary-button admin-settings-reset" type="button">Reset Defaults</button>
        </div>
      </div>
    </form>
  </section>
`

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
        <span>${escapeHtml(product.clubOrNation)} &middot; ${escapeHtml(product.variant)}</span>
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
        <label class="field">
          <span>League</span>
          <input id="admin-league" type="text" value="${escapeHtml(form.league)}" placeholder="Premier League / La Liga / National Team Archive" />
        </label>
        <label class="field">
          <span>Condition</span>
          <span class="shop-select-wrap">
            <select id="admin-condition" class="shop-select">
              <option value="Excellent" ${form.condition === 'Excellent' ? 'selected' : ''}>Excellent</option>
              <option value="Very Good" ${form.condition === 'Very Good' ? 'selected' : ''}>Very Good</option>
              <option value="Good" ${form.condition === 'Good' ? 'selected' : ''}>Good</option>
              <option value="Fair" ${form.condition === 'Fair' ? 'selected' : ''}>Fair</option>
            </select>
          </span>
        </label>
        <label class="field">
          <span>Authenticity</span>
          <span class="shop-select-wrap">
            <select id="admin-authenticity" class="shop-select">
              <option value="Verified" ${form.authenticity === 'Verified' ? 'selected' : ''}>Verified</option>
              <option value="Authenticated" ${form.authenticity === 'Authenticated' ? 'selected' : ''}>Authenticated</option>
              <option value="Store Verified" ${form.authenticity === 'Store Verified' ? 'selected' : ''}>Store Verified</option>
            </select>
          </span>
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
          <img class="admin-brand-logo" src="/logo Core Diski.png" alt="Core Diski logo" />
          <div>
            <p class="admin-brand-title">CORE DISKI</p>
            <p class="admin-brand-subtitle">Admin Portal</p>
          </div>
        </div>

        <button
          id="admin-mobile-menu-toggle"
          class="menu-toggle admin-menu-toggle"
          type="button"
          aria-expanded="false"
          aria-controls="admin-primary-nav"
          aria-label="Toggle admin navigation menu"
        >
          <span class="menu-toggle-line"></span>
          <span class="menu-toggle-line"></span>
          <span class="menu-toggle-line"></span>
        </button>

        <nav id="admin-primary-nav" class="admin-topnav" aria-label="Admin Navigation" aria-hidden="false">
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
            ${renderSidebarLink('admin-nav-orders', 'Orders', activeView === 'orders')}
            ${renderSidebarLink('admin-nav-customers', 'Customers', activeView === 'customers')}
            ${renderSidebarLink('admin-nav-categories', 'Categories', false)}
            ${renderSidebarLink('admin-nav-analytics', 'Analytics', activeView === 'analytics')}
            ${renderSidebarLink('admin-nav-settings', 'Settings', activeView === 'settings')}
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
              : activeView === 'orders'
                ? renderOrdersPage(data.filteredOrders, state, data, searchTerm)
                : activeView === 'customers'
                  ? renderCustomersPage(data.filteredCustomers, state, data, searchTerm)
                  : activeView === 'analytics'
                    ? renderAnalyticsPage(data, state, searchTerm)
                    : activeView === 'settings'
                      ? renderSettingsPage(data, state, searchTerm)
                      : renderDashboardPage(data, searchTerm)
          }
        </main>
      </div>
    </div>
  `
}
