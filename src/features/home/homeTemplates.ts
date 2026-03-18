import { brandLogoSrc } from '../../config/site.ts'
import { escapeHtml } from '../../shared/utils/escapeHtml.ts'
import { renderStorefrontShell } from '../../shared/templates/renderStorefrontShell.ts'
import { getProductMediaAttributes } from '../shop/productMedia.ts'
import type { ShopItem } from '../shop/shopTypes.ts'

type RenderHomePageOptions = {
  actionButton: {
    id: string
    isActive: boolean
    label: string
  }
  featuredProducts: ShopItem[]
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

const heartIcon = (isWishlisted: boolean) => `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5A4.5 4.5 0 0 1 6.5 4C8.24 4 9.91 4.81 11 6.09 12.09 4.81 13.76 4 15.5 4A4.5 4.5 0 0 1 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z" ${isWishlisted ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="1.8"'} />
  </svg>
`

const renderFeaturedProductCard = (item: ShopItem) => `
  <article class="shop-card home-featured-card">
    <a class="shop-card-link" href="#product/${escapeHtml(item.id)}" data-product-id="${escapeHtml(item.id)}">
      <div class="shop-card-media ${item.imageTheme}" ${getProductMediaAttributes(item)}></div>
      <div class="shop-card-body">
        <h3>${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(item.seasonLabel)}</p>
        <strong>R ${item.price}</strong>
      </div>
    </a>
    <button
      class="shop-card-wishlist ${item.isWishlisted ? 'is-active' : ''}"
      type="button"
      data-wishlist-toggle="${escapeHtml(item.id)}"
      aria-label="${item.isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}"
    >
      ${heartIcon(item.isWishlisted)}
    </button>
  </article>
`

export const renderHomePage = ({ actionButton, featuredProducts }: RenderHomePageOptions) => {
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

    <section class="home-featured-section">
      <div class="home-section-heading">
        <h2>Featured</h2>
        <p>Explore some of our most sought-after authentic football shirts.</p>
      </div>

      <div class="home-featured-grid">
        ${featuredProducts.map(renderFeaturedProductCard).join('')}
      </div>
    </section>

    <section class="home-about-section">
      <div class="home-about-copy">
        <h2>About Us</h2>
        <p>
          Welcome to Core Diski, the home for collectors of authentic, rare, and classic football shirts.
          Our passion is to bring you the most sought-after, verified jerseys from legendary clubs and national teams.
        </p>
        <button id="home-about-cta" class="home-about-button" type="button">Learn More</button>
      </div>

      <aside class="home-about-highlight" aria-label="Historic Shirt Archive">
        <div class="home-about-highlight-card">
          <strong>Historic Shirt Archive</strong>
        </div>
      </aside>
    </section>

    <footer class="home-footer">
      <div class="home-footer-grid">
        <section class="home-footer-brand">
          <img class="home-footer-logo" src="${brandLogoSrc}" alt="Core Diski crest" />
          <div>
            <h2>CORE DISKI</h2>
            <p>
              Authentic football shirts for collectors who care about heritage, verification, and timeless design.
            </p>
          </div>
        </section>

        <nav class="home-footer-column" aria-label="Footer Navigation">
          <h3>Explore</h3>
          <a href="#home">Home</a>
          <a href="#shop">Shop</a>
          <a href="#cart">Cart</a>
          <a href="#wishlist">Wishlist</a>
        </nav>

        <section class="home-footer-column">
          <h3>Account</h3>
          <a href="#profile">Profile</a>
          <a href="#auth">Sign In</a>
          <a href="#checkout">Checkout</a>
          <a href="#shop">Featured Jerseys</a>
        </section>

        <section class="home-footer-column">
          <h3>Contact</h3>
          <a href="mailto:Corediski@gmail.com">Corediski@gmail.com</a>
          <a href="https://www.instagram.com/corediski?igsh=NDRweXV0dHZsdXR6" target="_blank" rel="noreferrer">Instagram</a>
          <span>South Africa</span>
          <span>Authentic Football Shirts</span>
        </section>
      </div>

      <div class="home-footer-bottom">
        <p>© 2026 Core Diski. Built for shirt collectors.</p>
      </div>
    </footer>
  `

  return renderStorefrontShell({
    actionButton,
    activeNavHref: '#home',
    mainContent,
    pageContentClass: 'page-content-home',
  })
}
