import { renderStorefrontShell } from '../../shared/templates/renderStorefrontShell.ts'
import { escapeHtml } from '../../shared/utils/escapeHtml.ts'
import { shopTeams } from './shopCatalog.ts'
import { getProductMediaAttributes } from './productMedia.ts'
import { getFilteredShopItems } from './shopSelectors.ts'
import type { ShopFilters, ShopItem } from './shopTypes.ts'

type RenderShopPageOptions = {
  actionButton: {
    id: string
    isActive: boolean
    label: string
  }
  filters: ShopFilters
}

const heartIcon = (isWishlisted: boolean) => `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5A4.5 4.5 0 0 1 6.5 4C8.24 4 9.91 4.81 11 6.09 12.09 4.81 13.76 4 15.5 4A4.5 4.5 0 0 1 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z" ${isWishlisted ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="1.8"'} />
  </svg>
`

const renderProductCard = (item: ShopItem) => `
  <article class="shop-card">
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

export const renderShopPage = ({ actionButton, filters }: RenderShopPageOptions) => {
  const items = getFilteredShopItems(filters)
  const resultLabel = `${items.length} result${items.length === 1 ? '' : 's'}`

  const mainContent = `
    <section class="shop-page">
      <aside class="shop-filters">
        <div class="shop-filters-card">
          <h1>Filters</h1>
          <div class="shop-filter-group">
            <h2>Team</h2>
            <div class="shop-filter-checkboxes">
              ${shopTeams
                ()
                .map(
                  (team) => `
                    <label class="shop-checkbox">
                      <input
                        type="checkbox"
                        class="shop-team-filter"
                        value="${escapeHtml(team)}"
                        ${filters.selectedTeams.includes(team) ? 'checked' : ''}
                      />
                      <span>${escapeHtml(team)}</span>
                    </label>
                  `,
                )
                .join('')}
            </div>
          </div>

          <div class="shop-filter-group">
            <h2>Era</h2>
            <label class="shop-select-wrap">
              <select id="shop-era-select" class="shop-select">
                <option value="all" ${filters.era === 'all' ? 'selected' : ''}>All eras</option>
                <option value="1990s" ${filters.era === '1990s' ? 'selected' : ''}>1990s</option>
                <option value="2000s" ${filters.era === '2000s' ? 'selected' : ''}>2000s</option>
                <option value="2010s" ${filters.era === '2010s' ? 'selected' : ''}>2010s</option>
              </select>
            </label>
          </div>

          <button id="shop-reset-all" class="shop-reset-all" type="button">Reset all</button>
        </div>
      </aside>

      <section class="shop-results">
        <div class="shop-breadcrumb">Home / Shop</div>
        <div class="shop-heading">
          <h1>Search Results</h1>
          <p>Explore our collection of authentic, verified football shirts from every club and nation worldwide.</p>
        </div>

        <form id="shop-toolbar" class="shop-toolbar">
          <input
            id="shop-search-input"
            class="shop-search-input"
            type="search"
            value="${escapeHtml(filters.searchTerm)}"
            placeholder="Search clubs, players, seasons, leagues..."
          />
          <label class="shop-select-wrap">
            <select id="shop-price-select" class="shop-select">
              <option value="all" ${filters.priceRange === 'all' ? 'selected' : ''}>All prices</option>
              <option value="0-200" ${filters.priceRange === '0-200' ? 'selected' : ''}>R0 - R200</option>
              <option value="201-300" ${filters.priceRange === '201-300' ? 'selected' : ''}>R201 - R300</option>
              <option value="301-500" ${filters.priceRange === '301-500' ? 'selected' : ''}>R301 - R500</option>
            </select>
          </label>
          <label class="shop-select-wrap">
            <select id="shop-sort-select" class="shop-select">
              <option value="most-popular" ${filters.sortBy === 'most-popular' ? 'selected' : ''}>Most Popular</option>
              <option value="latest" ${filters.sortBy === 'latest' ? 'selected' : ''}>Latest</option>
              <option value="price-low-high" ${filters.sortBy === 'price-low-high' ? 'selected' : ''}>Price: Low to High</option>
              <option value="price-high-low" ${filters.sortBy === 'price-high-low' ? 'selected' : ''}>Price: High to Low</option>
            </select>
          </label>
          <button id="shop-toolbar-reset" class="shop-toolbar-reset" type="button">Reset</button>
        </form>

        <div class="shop-results-count">${resultLabel}</div>

        <div class="shop-grid">
          ${items.map(renderProductCard).join('')}
        </div>
      </section>
    </section>
  `

  return renderStorefrontShell({
    actionButton,
    activeNavHref: '#shop',
    mainContent,
    pageContentClass: 'page-content-shop',
  })
}
