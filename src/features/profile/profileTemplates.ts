import type { Session } from '@supabase/supabase-js'
import { renderStorefrontShell } from '../../shared/templates/renderStorefrontShell.ts'
import { escapeHtml } from '../../shared/utils/escapeHtml.ts'
import type { OrderRecord } from '../orders/orderTypes.ts'
import type { ProfilePageState } from './profileTypes.ts'

type RenderProfilePageOptions = {
  profileState: ProfilePageState
  session: Session
}

const formatMemberSince = (isoDate: string | undefined) => {
  if (!isoDate) {
    return 'Recently'
  }

  const date = new Date(isoDate)

  if (Number.isNaN(date.getTime())) {
    return 'Recently'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

const getProfileName = ({ profileState, session }: RenderProfilePageOptions) => {
  if (profileState.profile?.fullName.trim()) {
    return profileState.profile.fullName.trim()
  }

  const fullName = session.user.user_metadata.full_name

  if (typeof fullName === 'string' && fullName.trim()) {
    return fullName.trim()
  }

  return 'Core Diski Supporter'
}

const getProfileEmail = ({ profileState, session }: RenderProfilePageOptions) =>
  profileState.profile?.email || session.user.email || 'No email address'

const getProfileInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'CD'

const renderNotice = (profileState: ProfilePageState) => {
  if (!profileState.notice) {
    return ''
  }

  return `
    <div class="notice notice-${profileState.notice.tone}" role="status" aria-live="polite">
      ${escapeHtml(profileState.notice.message)}
    </div>
  `
}

const renderSummaryValue = (value: string | null | undefined) => {
  if (!value) {
    return 'Not set'
  }

  return escapeHtml(value)
}

const formatOrderDate = (isoDate: string) => {
  const date = new Date(isoDate)

  if (Number.isNaN(date.getTime())) {
    return 'Recently'
  }

  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

const formatOrderStatus = (status: OrderRecord['status']) =>
  status.charAt(0).toUpperCase() + status.slice(1)

const renderOrderHistory = (orders: OrderRecord[]) => {
  if (!orders.length) {
    return `
      <div class="order-history-empty">
        <h4>No orders yet</h4>
        <p>Your completed checkout orders will appear here.</p>
      </div>
    `
  }

  return `
    <div class="order-history-list">
      ${orders
        .map(
          (order) => `
            <article class="order-history-item">
              <div class="order-history-top">
                <div>
                  <h4>Order ${escapeHtml(order.id)}</h4>
                  <p>Placed on ${escapeHtml(formatOrderDate(order.createdAt))}</p>
                </div>
                <span class="order-status order-status-${order.status}">
                  ${escapeHtml(formatOrderStatus(order.status))}
                </span>
              </div>
              <div class="order-history-meta">
                <span>${order.items.length} item${order.items.length === 1 ? '' : 's'}</span>
                <strong>R ${order.total}</strong>
              </div>
              <div class="order-history-products">
                ${order.items
                  .map(
                    (item) => `
                      <div class="order-history-product">
                        <span>${escapeHtml(item.product.name)} ${escapeHtml(item.product.seasonLabel)}</span>
                        <span>Size ${item.size} · Qty ${item.quantity}</span>
                      </div>
                    `,
                  )
                  .join('')}
              </div>
            </article>
          `,
        )
        .join('')}
    </div>
  `
}

export const renderProfilePage = ({ profileState, session }: RenderProfilePageOptions) => {
  const savedProfileName = getProfileName({ profileState, session })
  const profileEmail = getProfileEmail({ profileState, session })
  const profile = profileState.profile
  const isFormLocked = !profileState.isEditing || profileState.isSaving || profileState.isLoading
  const displayName =
    profileState.isEditing && profileState.form.fullName.trim()
      ? profileState.form.fullName.trim()
      : savedProfileName
  const displayPhone =
    profileState.isEditing && profileState.form.phone.trim()
      ? profileState.form.phone.trim()
      : profile?.phone
  const displayAddress =
    profileState.isEditing && profileState.form.address.trim()
      ? profileState.form.address.trim()
      : profile?.address
  const displayEmailPreferences =
    profileState.isEditing && profileState.form.emailPreferences.trim()
      ? profileState.form.emailPreferences.trim()
      : profile?.emailPreferences ?? 'General updates'
  const profileInitials = getProfileInitials(displayName)
  const memberSince = formatMemberSince(profile?.createdAt ?? session.user.created_at)
  const isAdmin = profile?.role === 'admin'
  const summaryCounts = {
    completed:
      profileState.orderHistory.length > 0 ? profileState.orderSummary.completed : (profile?.completedOrders ?? 0),
    pending:
      profileState.orderHistory.length > 0 ? profileState.orderSummary.pending : (profile?.pendingOrders ?? 0),
    shipped:
      profileState.orderHistory.length > 0 ? profileState.orderSummary.shipped : (profile?.shippedOrders ?? 0),
  }

  const profileContent = `
    <div class="profile-page">
      <aside class="profile-sidebar">
        <div class="sidebar-card">
          <h2>My Account</h2>
          <nav class="sidebar-nav">
            <button id="profile-nav-overview" class="sidebar-link is-active" type="button">Account Overview</button>
            <button id="profile-nav-orders" class="sidebar-link" type="button">Order History</button>
            <button id="profile-nav-wishlist" class="sidebar-link" type="button">Wishlist</button>
            <button id="profile-nav-settings" class="sidebar-link" type="button">Account Settings</button>
            ${isAdmin ? '<button id="profile-nav-admin" class="sidebar-link" type="button">Admin Portal</button>' : ''}
            <button id="sidebar-logout" class="sidebar-link sidebar-link-logout" type="button">
              Log Out
            </button>
          </nav>
        </div>
      </aside>

      <section class="profile-content">
        <div id="profile-overview-section" class="profile-heading">
          <h1>My Profile</h1>
        </div>

        <section class="profile-hero-card">
          <div class="profile-hero-main">
            <div class="profile-avatar">${escapeHtml(profileInitials)}</div>
            <div class="profile-hero-copy">
              <h2>${escapeHtml(displayName)}</h2>
              <p>${escapeHtml(profileEmail)}</p>
              <p>Member since: ${escapeHtml(memberSince)}</p>
            </div>
          </div>
          <button
            id="edit-profile"
            class="secondary-button profile-edit-button"
            type="button"
            ${profileState.isLoading || profileState.isSaving ? 'disabled' : ''}
          >
            Edit Profile
          </button>
        </section>

        ${renderNotice(profileState)}

        <div class="profile-summary-grid">
          <section class="summary-card">
            <h3>Order Summary</h3>
            <div class="summary-list">
              <div class="summary-row">
                <span>Pending Orders</span>
                <strong>${summaryCounts.pending}</strong>
              </div>
              <div class="summary-row">
                <span>Shipped</span>
                <strong>${summaryCounts.shipped}</strong>
              </div>
              <div class="summary-row">
                <span>Completed</span>
                <strong>${summaryCounts.completed}</strong>
              </div>
            </div>
          </section>

          <section class="summary-card">
            <h3>Account Settings</h3>
            <div class="summary-list">
              <div class="summary-row">
                <span>Phone</span>
                <strong>${renderSummaryValue(displayPhone)}</strong>
              </div>
              <div class="summary-row">
                <span>Address</span>
                <strong>${renderSummaryValue(displayAddress)}</strong>
              </div>
              <div class="summary-row">
                <span>Email Preferences</span>
                <strong>${escapeHtml(displayEmailPreferences)}</strong>
              </div>
            </div>
          </section>
        </div>

        <section id="profile-orders-section" class="profile-form-card profile-orders-card">
          <h3>Order History</h3>
          ${renderOrderHistory(profileState.orderHistory)}
        </section>

        <section id="profile-settings-section" class="profile-form-card">
          <h3>Edit Personal Information</h3>
          <form id="profile-form" class="profile-form">
            <div class="profile-form-grid">
              <label class="field">
                <span>Full Name</span>
                <input
                  id="profile-full-name"
                  type="text"
                  value="${escapeHtml(profileState.form.fullName)}"
                  ${isFormLocked ? 'disabled' : ''}
                />
              </label>

              <label class="field">
                <span>Email Address</span>
                <input
                  id="profile-email"
                  type="email"
                  value="${escapeHtml(profileEmail)}"
                  readonly
                />
              </label>

              <label class="field">
                <span>Phone Number</span>
                <input
                  id="profile-phone"
                  type="text"
                  placeholder="+27 82 123 4567"
                  value="${escapeHtml(profileState.form.phone)}"
                  ${isFormLocked ? 'disabled' : ''}
                />
              </label>

              <label class="field">
                <span>Email Preferences</span>
                <input
                  id="profile-email-preferences"
                  type="text"
                  value="${escapeHtml(profileState.form.emailPreferences)}"
                  ${isFormLocked ? 'disabled' : ''}
                />
              </label>
            </div>

            <label class="field field-full">
              <span>Address</span>
              <textarea
                id="profile-address"
                class="profile-textarea"
                rows="4"
                placeholder="Street, City, Postal Code"
                ${isFormLocked ? 'disabled' : ''}
              >${escapeHtml(profileState.form.address)}</textarea>
            </label>

            <div class="profile-form-actions">
              <button
                class="primary-button profile-save-button"
                type="submit"
                ${!profileState.isEditing || profileState.isSaving || profileState.isLoading ? 'disabled' : ''}
              >
                ${profileState.isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                id="cancel-profile"
                class="tertiary-button"
                type="button"
                ${!profileState.isEditing || profileState.isSaving || profileState.isLoading ? 'disabled' : ''}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      </section>
    </div>
  `

  return renderStorefrontShell({
    actionButton: {
      id: 'header-profile-action',
      isActive: true,
      label: 'Profile',
    },
    mainContent: profileContent,
    pageContentClass: 'page-content-profile',
  })
}
