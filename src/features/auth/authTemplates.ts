import { isSupabaseConfigured } from '../../lib/supabase.ts'
import { renderStorefrontShell } from '../../shared/templates/renderStorefrontShell.ts'
import { escapeHtml } from '../../shared/utils/escapeHtml.ts'
import { getAuthStatusLabel } from './authSelectors.ts'
import type { AuthPageState } from './authTypes.ts'

const renderNotice = (state: AuthPageState) => {
  if (!state.notice) {
    return ''
  }

  return `
    <div class="notice notice-${state.notice.tone}" role="status" aria-live="polite">
      ${escapeHtml(state.notice.message)}
    </div>
  `
}

const renderEyeIcon = (showPassword: boolean) => {
  if (showPassword) {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.53 2.47 2.47 3.53l4.18 4.18C4.66 9.14 3.2 10.94 2 12c2.39 2.12 5.76 4.5 10 4.5 1.7 0 3.27-.38 4.68-.99l3.79 3.79 1.06-1.06ZM12 9a3 3 0 0 1 3 3c0 .5-.12.98-.34 1.4l-4.06-4.06C11.02 9.12 11.5 9 12 9Zm0-3.5c-1.45 0-2.82.28-4.08.76l1.69 1.69A5 5 0 0 1 17 12c0 .95-.26 1.84-.72 2.6l1.46 1.46c1.73-1 3.21-2.45 4.26-4.06-2.39-2.12-5.76-4.5-10-4.5Z"/>
      </svg>
    `
  }

  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5.5c-4.24 0-7.61 2.38-10 4.5 2.39 2.12 5.76 4.5 10 4.5s7.61-2.38 10-4.5c-2.39-2.12-5.76-4.5-10-4.5Zm0 7.5a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/>
    </svg>
  `
}

export const renderAuthPage = (state: AuthPageState) => {
  const isSignUp = state.mode === 'sign-up'
  const submitLabel = state.isSubmitting
    ? isSignUp
      ? 'Creating Account...'
      : 'Signing In...'
    : isSignUp
      ? 'Create Account'
      : 'Sign In'

  const authCard = `
    <div class="page-grid">
      <section class="auth-card">
        <div class="auth-card-inner">
          ${isSignUp ? `<p class="auth-chip">${getAuthStatusLabel()}</p>` : ''}
          <h1>${isSignUp ? 'Create Your Account' : 'Welcome Back'}</h1>
          <p class="auth-copy">
            ${
              isSignUp
                ? 'Register before adding items to cart or purchasing.'
                : 'Sign in to continue shopping.'
            }
          </p>
          ${renderNotice(state)}
          <form id="auth-form" class="auth-form">
            ${
              isSignUp
                ? `
                  <label class="field">
                    <span>Full Name</span>
                    <input
                      id="full-name"
                      name="fullName"
                      type="text"
                      autocomplete="name"
                      value="${escapeHtml(state.fullName)}"
                      ${state.isSubmitting || !isSupabaseConfigured ? 'disabled' : ''}
                    />
                  </label>
                `
                : ''
            }
            <label class="field">
              <span>Email Address</span>
              <input
                id="email"
                name="email"
                type="email"
                autocomplete="email"
                placeholder="you@email.com"
                value="${escapeHtml(state.email)}"
                ${state.isSubmitting || !isSupabaseConfigured ? 'disabled' : ''}
              />
            </label>
            <label class="field">
              <span>Password</span>
              <div class="password-row">
                <input
                  id="password"
                  name="password"
                  type="${state.showPassword ? 'text' : 'password'}"
                  autocomplete="${isSignUp ? 'new-password' : 'current-password'}"
                  value="${escapeHtml(state.password)}"
                  ${state.isSubmitting || !isSupabaseConfigured ? 'disabled' : ''}
                />
                <button
                  id="toggle-password"
                  class="password-toggle"
                  type="button"
                  aria-label="${state.showPassword ? 'Hide password' : 'Show password'}"
                  ${state.isSubmitting || !isSupabaseConfigured ? 'disabled' : ''}
                >
                  ${renderEyeIcon(state.showPassword)}
                </button>
              </div>
            </label>

            <button
              class="primary-button"
              type="submit"
              ${state.isSubmitting || !isSupabaseConfigured ? 'disabled' : ''}
            >
              ${submitLabel}
            </button>
          </form>

          <div class="auth-footer">
            <span class="footer-spacer"></span>
            <p class="switch-copy">
              ${
                isSignUp
                  ? `Already have an account? <button id="switch-mode" class="text-link inline-link" type="button">Sign In</button>`
                  : `Don't have an account? <button id="switch-mode" class="text-link inline-link" type="button">Create Account</button>`
              }
            </p>
          </div>
        </div>
      </section>
    </div>
  `

  return renderStorefrontShell({
    actionButton: {
      id: 'header-auth-action',
      isActive: state.mode === 'sign-in',
      label: 'Sign In',
    },
    mainContent: authCard,
  })
}
