import { brandLogoSrc, brandSubtitle, brandTitle, navigationLinks } from '../../config/site.ts'
import { escapeHtml } from '../utils/escapeHtml.ts'

type StorefrontShellOptions = {
  actionButton: {
    id: string
    isActive: boolean
    label: string
  }
  activeNavHref?: string
  mainContent: string
  pageContentClass?: string
}

export const renderStorefrontShell = ({
  actionButton,
  activeNavHref,
  mainContent,
  pageContentClass,
}: StorefrontShellOptions) => {
  const navigationMarkup = navigationLinks
    .map(
      ({ href, label }) =>
        `<a href="${href}" class="nav-link ${activeNavHref === href ? 'is-active' : ''}">${escapeHtml(label)}</a>`,
    )
    .join('')

  return `
    <div class="store-shell">
      <header class="topbar">
        <div class="brand">
          <img class="brand-logo" src="${brandLogoSrc}" alt="Core Diski logo" />
          <div class="brand-copy">
            <p class="brand-title">${brandTitle}</p>
            <p class="brand-subtitle">${brandSubtitle}</p>
          </div>
        </div>

        <nav class="topnav" aria-label="Primary">
          ${navigationMarkup}
          <button
            id="${escapeHtml(actionButton.id)}"
            class="nav-auth ${actionButton.isActive ? 'is-active' : ''}"
            type="button"
          >
            ${escapeHtml(actionButton.label)}
          </button>
        </nav>
      </header>

      <main class="page-content ${pageContentClass ?? ''}">
        ${mainContent}
      </main>
    </div>
  `
}
