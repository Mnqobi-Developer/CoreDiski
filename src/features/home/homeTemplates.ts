import { brandLogoSrc } from '../../config/site.ts'
import { renderStorefrontShell } from '../../shared/templates/renderStorefrontShell.ts'

type RenderHomePageOptions = {
  actionButton: {
    id: string
    isActive: boolean
    label: string
  }
}

const searchIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M10.5 4a6.5 6.5 0 1 0 4.03 11.6l4.43 4.44 1.06-1.06-4.44-4.43A6.5 6.5 0 0 0 10.5 4Zm0 1.5a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z"/>
  </svg>
`

const authenticityIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m12 2 7 3v6c0 5-3.4 9.74-7 11-3.6-1.26-7-6-7-11V5l7-3Zm0 2.06L7 6.21V11c0 3.92 2.5 7.9 5 9.13 2.5-1.24 5-5.22 5-9.13V6.2l-5-2.15Zm-1 4.44 4 4-1.06 1.06L11 10.62l-1.94 1.94L8 11.5 11 8.5Z"/>
  </svg>
`

const shippingIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 6h11v9H3V6Zm12 2h2.76L21 11.24V15h-2a2.5 2.5 0 0 0-5 0h-1v-1h2V8Zm1.5 9a1 1 0 1 1 0 2 1 1 0 0 1 0-2ZM8 17a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm-4-1h1a2.5 2.5 0 0 0 5 0h4a2.5 2.5 0 0 0 5 0h2v2h-1.17a2.99 2.99 0 0 1-5.66 0h-3.34a2.99 2.99 0 0 1-5.66 0H4v-2Z"/>
  </svg>
`

const shieldIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m12 2 7 3v6c0 5-3.4 9.74-7 11-3.6-1.26-7-6-7-11V5l7-3Zm0 2.06L7 6.21V11c0 3.92 2.5 7.9 5 9.13 2.5-1.24 5-5.22 5-9.13V6.2l-5-2.15Z"/>
  </svg>
`

export const renderHomePage = ({ actionButton }: RenderHomePageOptions) => {
  const mainContent = `
    <section class="hero-home">
      <img class="hero-home-logo" src="${brandLogoSrc}" alt="Core Diski crest" />
      <div class="hero-home-copy">
        <h1>Authentic Football Shirts</h1>
        <p>
          Discover rare, verified jerseys from every club and nation worldwide.
          Heritage. Authenticity. Passion.
        </p>
      </div>

      <form id="home-search-form" class="hero-search" role="search">
        <label class="hero-search-field">
          <span class="hero-search-icon">${searchIcon}</span>
          <input
            id="home-search-input"
            type="search"
            placeholder="Search teams, leagues, or players..."
            autocomplete="off"
          />
        </label>
        <button class="hero-search-button" type="submit">Search</button>
      </form>

      <div class="hero-popular">
        <span>Popular:</span>
        <button class="hero-popular-link" type="button" data-search="Manchester United">Manchester United</button>
        <button class="hero-popular-link" type="button" data-search="Barcelona">Barcelona</button>
        <button class="hero-popular-link" type="button" data-search="Bafana Bafana">Bafana Bafana</button>
        <button class="hero-popular-link" type="button" data-search="Real Madrid">Real Madrid</button>
        <button class="hero-popular-link" type="button" data-search="PSG">PSG</button>
      </div>

      <div class="hero-benefits">
        <article class="hero-benefit-card">
          <div class="hero-benefit-icon">${authenticityIcon}</div>
          <div>
            <h2>Verified Authentic</h2>
            <p>Every shirt authenticated before sale</p>
          </div>
        </article>

        <article class="hero-benefit-card">
          <div class="hero-benefit-icon">${shippingIcon}</div>
          <div>
            <h2>Global Shipping</h2>
            <p>Delivered worldwide with tracking</p>
          </div>
        </article>

        <article class="hero-benefit-card">
          <div class="hero-benefit-icon">${shieldIcon}</div>
          <div>
            <h2>Secure Payments</h2>
            <p>Bank-grade encryption &amp; protection</p>
          </div>
        </article>
      </div>
    </section>
  `

  return renderStorefrontShell({
    actionButton,
    activeNavHref: '#home',
    mainContent,
    pageContentClass: 'page-content-home',
  })
}
