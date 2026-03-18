import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured } from '../lib/supabase.ts'
import { getEmailRedirectTo } from '../config/site.ts'
import { getAdminDashboardData } from '../features/admin/adminSelectors.ts'
import {
  createDefaultAdminSettingsForm,
  createEmptyAdminProductForm,
  createInitialAdminState,
} from '../features/admin/adminState.ts'
import { getStoreSettings, upsertStoreSettings } from '../features/admin/adminSettingsService.ts'
import { writeAdminSettings } from '../features/admin/adminSettingsStorage.ts'
import { renderAdminPage } from '../features/admin/adminTemplates.ts'
import {
  shopCatalog,
  hydrateShopCatalog,
  buildAdminProduct,
  replaceShopCatalog,
  upsertShopProduct,
} from '../features/shop/shopCatalog.ts'
import {
  getCurrentSession,
  signInWithEmail,
  signOutCurrentUser,
  signUpWithEmail,
  subscribeToAuthChanges,
} from '../features/auth/authService.ts'
import { createInitialAuthState } from '../features/auth/authState.ts'
import { renderAuthPage } from '../features/auth/authTemplates.ts'
import type { AuthMode } from '../features/auth/authTypes.ts'
import { getCartLineItems, getCartShippingTotal, getCartSubtotal, getCartTotal } from '../features/cart/cartSelectors.ts'
import { createInitialCartState } from '../features/cart/cartState.ts'
import { writeCartItems } from '../features/cart/cartStorage.ts'
import { renderCartPage } from '../features/cart/cartTemplates.ts'
import type { CartItem } from '../features/cart/cartTypes.ts'
import { createInitialCheckoutState } from '../features/checkout/checkoutState.ts'
import { renderCheckoutPage } from '../features/checkout/checkoutTemplates.ts'
import { renderHomePage } from '../features/home/homeTemplates.ts'
import { getOrdersForUser, getOrderSummary } from '../features/orders/orderSelectors.ts'
import { createOrderRecord, listOrders, updateOrderRecord } from '../features/orders/orderService.ts'
import { createInitialOrderState } from '../features/orders/orderState.ts'
import { readOrders, writeOrders } from '../features/orders/orderStorage.ts'
import type { OrderRecord } from '../features/orders/orderTypes.ts'
import { createInitialProfileState } from '../features/profile/profileState.ts'
import {
  listProfilesForAdmin,
  loadOrCreateProfile,
  saveProfile,
  updateProfileActiveStatus,
  updateProfileRole,
} from '../features/profile/profileService.ts'
import { renderProfilePage } from '../features/profile/profileTemplates.ts'
import type { ProfileRecord } from '../features/profile/profileTypes.ts'
import { renderProductPage } from '../features/product/productTemplates.ts'
import { listStoreProducts, upsertStoreProduct } from '../features/shop/productService.ts'
import { createInitialShopFilters } from '../features/shop/shopState.ts'
import { renderShopPage } from '../features/shop/shopTemplates.ts'
import type { PriceRange, ShirtSize, ShopEra, SortOption } from '../features/shop/shopTypes.ts'
import { getWishlistLineItems } from '../features/wishlist/wishlistSelectors.ts'
import { createInitialWishlistState } from '../features/wishlist/wishlistState.ts'
import { writeWishlistItems } from '../features/wishlist/wishlistStorage.ts'
import { renderWishlistPage } from '../features/wishlist/wishlistTemplates.ts'
import type { WishlistItem } from '../features/wishlist/wishlistTypes.ts'
import type { Notice } from '../shared/types/notice.ts'

type AppPage =
  | 'admin'
  | 'auth'
  | 'cart'
  | 'checkout'
  | 'home'
  | 'product'
  | 'profile'
  | 'shop'
  | 'wishlist'

export const mountStorefrontApp = async (appRoot: HTMLDivElement) => {
  hydrateShopCatalog()
  const adminState = createInitialAdminState()
  const authState = createInitialAuthState()
  const cartState = createInitialCartState()
  const checkoutState = createInitialCheckoutState()
  const orderState = createInitialOrderState()
  const profileState = createInitialProfileState()
  const shopFilters = createInitialShopFilters()
  const wishlistState = createInitialWishlistState()
  let adminProfiles: ProfileRecord[] = []
  let isLoadingAdminProfiles = false
  let session: Session | null = null
  let currentPage: AppPage = 'home'
  let currentProductId: string | null = null
  let selectedProductSize: ShirtSize = 'M'
  let adminSearchTerm = ''
  let shouldScrollToHomeHero = false

  const getShellActionButton = () =>
    session
      ? {
          id: 'header-profile-action',
          isActive: false,
          label: 'Profile',
        }
      : {
          id: 'header-auth-action',
          isActive: false,
          label: 'Sign In',
        }

  const isAdminUser = () =>
    profileState.profile ? profileState.profile.role === 'admin' : session?.user.user_metadata.role === 'admin'

  const getSignedInLandingPage = (): AppPage => (isAdminUser() ? 'admin' : 'profile')

  const getPageFromHash = (): AppPage => {
    const route = window.location.hash.replace('#', '').trim().toLowerCase()

    if (route === 'auth' || route === 'signin' || route === 'sign-in') {
      return 'auth'
    }

    if (route === 'admin') {
      return 'admin'
    }

    if (route === 'cart') {
      return 'cart'
    }

    if (route === 'checkout') {
      return 'checkout'
    }

    if (route === 'wishlist') {
      return 'wishlist'
    }

    if (route.startsWith('product/')) {
      return 'product'
    }

    if (route === 'shop') {
      return 'shop'
    }

    if (route === 'profile') {
      return 'profile'
    }

    return 'home'
  }

  const syncPageFromHash = () => {
    currentPage = getPageFromHash()
    currentProductId = currentPage === 'product' ? window.location.hash.replace('#product/', '') : null

    if (currentProductId) {
      const product = shopCatalog.find((item) => item.id === currentProductId)

      if (product) {
        selectedProductSize = product.availableSizes.includes(selectedProductSize)
          ? selectedProductSize
          : product.availableSizes[0]
      }
    }
  }

  const navigateTo = (page: AppPage, productId?: string) => {
    const nextHash = page === 'product' && productId ? `#product/${productId}` : `#${page}`

    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash
      return
    }

    syncPageFromHash()
    render()
  }

  const openHomeHero = () => {
    shouldScrollToHomeHero = true

    if (currentPage === 'home') {
      render()
      return
    }

    navigateTo('home')
  }

  const syncProfileForm = (profile: ProfileRecord | null) => {
    profileState.form = {
      address: profile?.address ?? '',
      emailPreferences: profile?.emailPreferences ?? 'General updates',
      fullName: profile?.fullName ?? '',
      phone: profile?.phone ?? '',
    }
  }

  const syncCheckoutForm = (profile: ProfileRecord | null) => {
    const profileAddress = profile?.address?.trim() ?? ''

    if (!checkoutState.form.shippingAddress.trim() && profileAddress) {
      checkoutState.form.shippingAddress = profileAddress
    }

    if (checkoutState.form.billingSameAsShipping) {
      checkoutState.form.billingAddress = checkoutState.form.shippingAddress
      return
    }

    if (!checkoutState.form.billingAddress.trim() && profileAddress) {
      checkoutState.form.billingAddress = profileAddress
    }
  }

  const resetProfileState = () => {
    const freshState = createInitialProfileState()

    profileState.form = freshState.form
    profileState.isEditing = freshState.isEditing
    profileState.isLoading = freshState.isLoading
    profileState.orderHistory = freshState.orderHistory
    profileState.orderSummary = freshState.orderSummary
    profileState.isSaving = freshState.isSaving
    profileState.notice = freshState.notice
    profileState.profile = freshState.profile
  }

  const persistCart = () => {
    writeCartItems(cartState.items)
  }

  const persistOrders = () => {
    writeOrders(orderState.items)
  }

  const persistWishlist = () => {
    writeWishlistItems(wishlistState.items)
  }

  const syncCatalogWishlistFlags = () => {
    const wishlistIds = new Set(wishlistState.items.map((item) => item.productId))

    shopCatalog.forEach((item) => {
      item.isWishlisted = wishlistIds.has(item.id)
    })
  }

  const setCartNotice = (notice: Notice | null) => {
    cartState.notice = notice
    render()
  }

  const setCheckoutNotice = (notice: Notice | null) => {
    checkoutState.notice = notice
    render()
  }

  const setWishlistNotice = (notice: Notice | null) => {
    wishlistState.notice = notice
    render()
  }

  const getCheckoutCustomer = () => {
    const profileName = profileState.profile?.fullName?.trim()
    const userName = session?.user.user_metadata.full_name
    const name =
      profileName ||
      (typeof userName === 'string' && userName.trim() ? userName.trim() : '') ||
      'Core Diski Customer'

    return {
      email: session?.user.email ?? profileState.profile?.email ?? 'No email address',
      name,
    }
  }

  const findCartItemIndex = (productId: string, size: ShirtSize) =>
    cartState.items.findIndex((item) => item.productId === productId && item.size === size)

  const addCartItem = (item: CartItem) => {
    const existingIndex = findCartItemIndex(item.productId, item.size)

    if (existingIndex >= 0) {
      cartState.items[existingIndex].quantity += item.quantity
    } else {
      cartState.items.push(item)
    }

    persistCart()
  }

  const removeCartLine = (lineId: string) => {
    cartState.items = cartState.items.filter((item) => `${item.productId}:${item.size}` !== lineId)
    persistCart()
  }

  const updateCartQuantity = (lineId: string, delta: number) => {
    const [productId, size] = lineId.split(':') as [string | undefined, ShirtSize | undefined]

    if (!productId || !size) {
      return
    }

    const item = cartState.items.find((entry) => entry.productId === productId && entry.size === size)

    if (!item) {
      return
    }

    item.quantity += delta

    if (item.quantity <= 0) {
      removeCartLine(lineId)
      return
    }

    persistCart()
  }

  const clearCart = () => {
    cartState.items = []
    persistCart()
  }

  const resetAdminProductForm = () => {
    adminState.editingProductId = null
    adminState.form = createEmptyAdminProductForm()
  }

  const parseAdminSeasonStart = (season: string) => {
    const match = season.trim().match(/^(\d{4})/)

    if (!match) {
      return null
    }

    const year = Number(match[1])

    return Number.isNaN(year) ? null : year
  }

  const syncProfileOrders = (userId: string) => {
    const orders = getOrdersForUser(orderState.items, userId)

    profileState.orderHistory = orders
    profileState.orderSummary = getOrderSummary(orders)
  }

  const upsertAdminProfile = (profile: ProfileRecord | null) => {
    if (!profile) {
      return
    }

    const existingIndex = adminProfiles.findIndex((entry) => entry.id === profile.id)

    if (existingIndex >= 0) {
      adminProfiles[existingIndex] = profile
      return
    }

    adminProfiles = [profile, ...adminProfiles]
  }

  const loadAdminProfiles = async () => {
    if (!session || !isAdminUser() || isLoadingAdminProfiles) {
      return
    }

    isLoadingAdminProfiles = true

    const { data, error } = await listProfilesForAdmin()

    isLoadingAdminProfiles = false

    if (error) {
      adminState.notice = {
        tone: 'error',
        message:
          'Unable to load all customer accounts. Run the admin customer SQL permissions if this persists.',
      }
      upsertAdminProfile(profileState.profile)
      render()
      return
    }

    adminProfiles = data
    upsertAdminProfile(profileState.profile)

    if (currentPage === 'admin') {
      render()
    }
  }

  const loadAdminSettingsFromDatabase = async () => {
    if (!isSupabaseConfigured) {
      return
    }

    const { data, error } = await getStoreSettings()

    if (error) {
      adminState.notice = {
        tone: 'error',
        message:
          error.message ||
          'Unable to load store settings from Supabase. Run the store settings SQL script if this persists.',
      }

      if (currentPage === 'admin') {
        render()
      }
      return
    }

    if (!data) {
      return
    }

    adminState.settingsForm = data
    writeAdminSettings(data)

    if (currentPage === 'admin') {
      render()
    }
  }

  const loadProductsFromDatabase = async () => {
    if (!isSupabaseConfigured) {
      return
    }

    const { data, error } = await listStoreProducts()

    if (error) {
      if (currentPage === 'admin') {
        adminState.notice = {
          tone: 'error',
          message:
            error.message ||
            'Unable to load products from Supabase. Run the products/orders SQL script if this persists.',
        }
        render()
      }
      return
    }

    if (!data.length) {
      return
    }

    replaceShopCatalog(data)
    syncCatalogWishlistFlags()
    render()
  }

  const loadOrdersFromDatabase = async (activeSession: Session) => {
    if (!isSupabaseConfigured) {
      return
    }

    const { data, error } = await listOrders()

    if (error) {
      const message =
        error.message ||
        'Unable to load orders from Supabase. Run the products/orders SQL script if this persists.'

      if (currentPage === 'admin') {
        adminState.notice = {
          tone: 'error',
          message,
        }
      } else {
        profileState.notice = {
          tone: 'error',
          message,
        }
      }
      render()
      return
    }

    orderState.items = data
    persistOrders()
    syncProfileOrders(activeSession.user.id)

    if (currentPage === 'admin' || currentPage === 'profile') {
      render()
    }
  }

  const getPreferredSize = (productId: string): ShirtSize | null => {
    const product = shopCatalog.find((item) => item.id === productId)

    if (!product) {
      return null
    }

    return product.availableSizes.includes('M') ? 'M' : product.availableSizes[0]
  }

  const isWishlisted = (productId: string) =>
    wishlistState.items.some((item) => item.productId === productId)

  const toggleWishlistItem = (item: WishlistItem) => {
    const isExisting = wishlistState.items.some((entry) => entry.productId === item.productId)

    if (isExisting) {
      wishlistState.items = wishlistState.items.filter((entry) => entry.productId !== item.productId)
    } else {
      wishlistState.items.push(item)
    }

    persistWishlist()
    syncCatalogWishlistFlags()
  }

  const removeWishlistLine = (lineId: string) => {
    const [productId] = lineId.split(':')

    wishlistState.items = wishlistState.items.filter((item) => item.productId !== productId)
    persistWishlist()
    syncCatalogWishlistFlags()
  }

  const render = () => {
    const currentProduct = currentProductId
      ? shopCatalog.find((item) => item.id === currentProductId) ?? null
      : null
    const adminData = getAdminDashboardData(
      shopCatalog,
      orderState.items,
      adminProfiles,
      adminSearchTerm,
      adminState.orderFilter,
      adminState.customerFilter,
    )
    const cartLines = getCartLineItems(cartState.items)
    const cartShipping = getCartShippingTotal(cartState.items)
    const cartSubtotal = getCartSubtotal(cartState.items)
    const cartTotal = getCartTotal(cartState.items)
    const wishlistLines = getWishlistLineItems(wishlistState.items)
    const requiresAuth =
      currentPage === 'admin' ||
      currentPage === 'profile' ||
      currentPage === 'cart' ||
      currentPage === 'checkout' ||
      currentPage === 'wishlist'

    if (currentPage === 'admin' && session && isAdminUser()) {
      appRoot.innerHTML = renderAdminPage({
        data: adminData,
        searchTerm: adminSearchTerm,
        state: adminState,
      })
    } else if (currentPage === 'profile' && session) {
      appRoot.innerHTML = renderProfilePage({
        profileState,
        session,
      })
    } else if (currentPage === 'cart' && session) {
      appRoot.innerHTML = renderCartPage({
        actionButton: getShellActionButton(),
        lines: cartLines,
        notice: cartState.notice,
        shipping: cartShipping,
        subtotal: cartSubtotal,
        total: cartTotal,
      })
    } else if (currentPage === 'checkout' && session) {
      syncCheckoutForm(profileState.profile)
      appRoot.innerHTML = renderCheckoutPage({
        actionButton: getShellActionButton(),
        customer: getCheckoutCustomer(),
        form: checkoutState.form,
        lines: cartLines,
        notice: checkoutState.notice,
        shipping: cartShipping,
        subtotal: cartSubtotal,
        total: cartTotal,
      })
    } else if (currentPage === 'wishlist' && session) {
      appRoot.innerHTML = renderWishlistPage({
        actionButton: getShellActionButton(),
        lines: wishlistLines,
        notice: wishlistState.notice,
      })
    } else if (currentPage === 'product' && currentProduct) {
      appRoot.innerHTML = renderProductPage({
        actionButton: getShellActionButton(),
        isWishlisted: isWishlisted(currentProduct.id),
        product: currentProduct,
        selectedSize: selectedProductSize,
      })
    } else if (currentPage === 'shop') {
      appRoot.innerHTML = renderShopPage({
        actionButton: getShellActionButton(),
        filters: shopFilters,
      })
    } else if (currentPage === 'auth' || (!session && requiresAuth)) {
      appRoot.innerHTML = renderAuthPage(authState)
    } else if (currentPage === 'admin' && session && !isAdminUser()) {
      profileState.notice = {
        tone: 'error',
        message: 'Admin access is only available to admin accounts.',
      }
      appRoot.innerHTML = renderProfilePage({
        profileState,
        session,
      })
    } else {
      const featuredProducts = shopCatalog.filter((item) => item.isFeatured)

      appRoot.innerHTML = renderHomePage({
        actionButton: getShellActionButton(),
        featuredProducts: (featuredProducts.length ? featuredProducts : shopCatalog).slice(0, 5),
      })
    }

    bindUi()
  }

  const setAuthNotice = (notice: Notice | null) => {
    authState.notice = notice
    render()
  }

  const setProfileNotice = (notice: Notice | null) => {
    profileState.notice = notice
    render()
  }

  const loadProfile = async (activeSession: Session) => {
    if (profileState.isLoading) {
      return
    }

    resetProfileState()
    profileState.isLoading = true
    render()

    const { data, error } = await loadOrCreateProfile(activeSession)

    profileState.isLoading = false

    if (error || !data) {
      setProfileNotice({
        tone: 'error',
        message: error?.message ?? 'Unable to load your profile right now.',
      })
      return
    }

    if (!data.isActive) {
      await signOutCurrentUser()
      handleSignedOutState({
        tone: 'error',
        message: 'This account has been removed. Contact support if you believe this is a mistake.',
      })
      return
    }

    profileState.profile = data
    upsertAdminProfile(data)
    syncProfileForm(data)
    syncCheckoutForm(data)
    render()
  }

  const openProfileForSession = async (
    nextSession: Session,
    options?: {
      showProfile?: boolean
    },
  ) => {
    session = nextSession
    syncProfileOrders(nextSession.user.id)

    if (profileState.profile?.id === nextSession.user.id) {
      if (profileState.profile.role === 'admin') {
        await loadAdminSettingsFromDatabase()
        await loadAdminProfiles()
      }
      await loadOrdersFromDatabase(nextSession)
      if (options?.showProfile) {
        currentPage = 'profile'
      }
      render()
      return
    }

    await loadProfile(nextSession)

    if (profileState.profile?.role === 'admin') {
      await loadAdminSettingsFromDatabase()
      await loadAdminProfiles()
    }

    await loadOrdersFromDatabase(nextSession)

    if (options?.showProfile) {
      currentPage = 'profile'
    }
    render()
  }

  const handleSignedOutState = (notice: Notice | null = null) => {
    session = null
    authState.mode = 'sign-in'
    authState.notice = notice
    authState.password = ''
    authState.showPassword = false
    adminSearchTerm = ''
    adminState.activeView = 'dashboard'
    adminState.customerFilter = 'all'
    adminState.orderFilter = 'all'
    adminState.notice = null
    adminProfiles = []
    orderState.items = readOrders()
    resetAdminProductForm()
    resetProfileState()
    currentPage = notice ? 'auth' : 'home'
    render()
  }

  const handleModeSwitch = (mode: AuthMode) => {
    authState.mode = mode
    authState.notice = null
    authState.password = ''
    authState.showPassword = false
    render()
  }

  const resetShopFilters = () => {
    const freshFilters = createInitialShopFilters()

    shopFilters.era = freshFilters.era
    shopFilters.priceRange = freshFilters.priceRange
    shopFilters.searchTerm = freshFilters.searchTerm
    shopFilters.selectedTeams = freshFilters.selectedTeams
    shopFilters.sortBy = freshFilters.sortBy
  }

  const applyShopSearch = (searchTerm: string) => {
    shopFilters.searchTerm = searchTerm.trim()
    navigateTo('shop')
  }

  const handleSignUp = async () => {
    const fullName = authState.fullName.trim()
    const email = authState.email.trim().toLowerCase()
    const password = authState.password

    if (!fullName) {
      setAuthNotice({ tone: 'error', message: 'Enter your full name to create an account.' })
      return
    }

    if (!email) {
      setAuthNotice({ tone: 'error', message: 'Enter your email address.' })
      return
    }

    if (password.length < 6) {
      setAuthNotice({ tone: 'error', message: 'Use a password with at least 6 characters.' })
      return
    }

    authState.isSubmitting = true
    render()

    const { data, error } = await signUpWithEmail({
      email,
      emailRedirectTo: getEmailRedirectTo(),
      fullName,
      password,
    })

    authState.isSubmitting = false

    if (error) {
      setAuthNotice({ tone: 'error', message: error.message })
      return
    }

    authState.email = email
    authState.fullName = fullName
    authState.password = ''

    if (data.session) {
      authState.notice = null
      await openProfileForSession(data.session, { showProfile: true })
      navigateTo(getSignedInLandingPage())
      return
    }

    authState.mode = 'sign-in'
    authState.showPassword = false
    setAuthNotice({
      tone: 'success',
      message: 'Account created. Check your inbox and verify your email before signing in.',
    })
  }

  const handleSignIn = async () => {
    const email = authState.email.trim().toLowerCase()
    const password = authState.password

    if (!email) {
      setAuthNotice({ tone: 'error', message: 'Enter your email address.' })
      return
    }

    if (!password) {
      setAuthNotice({ tone: 'error', message: 'Enter your password.' })
      return
    }

    authState.isSubmitting = true
    render()

    const { data, error } = await signInWithEmail({
      email,
      password,
    })

    authState.isSubmitting = false

    if (error) {
      setAuthNotice({ tone: 'error', message: error.message })
      return
    }

    authState.password = ''
    authState.notice = null
    await openProfileForSession(data.session, { showProfile: true })
    navigateTo(getSignedInLandingPage())
  }

  const handleSignOut = async () => {
    if (!session) {
      return
    }

    profileState.isSaving = true
    render()

    const { error } = await signOutCurrentUser()

    profileState.isSaving = false

    if (error) {
      setProfileNotice({ tone: 'error', message: error.message })
      return
    }

    handleSignedOutState({ tone: 'info', message: 'You have been signed out.' })
  }

  const handleStartEditing = () => {
    profileState.isEditing = true
    profileState.notice = null
    render()
  }

  const handleCancelEditing = () => {
    syncProfileForm(profileState.profile)
    profileState.isEditing = false
    profileState.notice = null
    render()
  }

  const handleSaveProfile = async () => {
    if (!session || !profileState.profile) {
      setProfileNotice({ tone: 'error', message: 'Sign in again to update your profile.' })
      return
    }

    const fullName = profileState.form.fullName.trim()

    if (!fullName) {
      setProfileNotice({ tone: 'error', message: 'Full name is required.' })
      return
    }

    profileState.isSaving = true
    render()

    const { data, error } = await saveProfile({
      email: session.user.email ?? profileState.profile.email,
      form: profileState.form,
      userId: session.user.id,
    })

    profileState.isSaving = false

    if (error || !data) {
      setProfileNotice({
        tone: 'error',
        message: error?.message ?? 'Unable to save your profile right now.',
      })
      return
    }

    profileState.profile = data
    upsertAdminProfile(data)
    syncProfileForm(data)
    syncCheckoutForm(data)
    profileState.isEditing = false
    setProfileNotice({ tone: 'success', message: 'Profile updated successfully.' })
  }

  const bindAuthUi = () => {
    const headerAuthAction = appRoot.querySelector<HTMLButtonElement>('#header-auth-action')
    const switchModeButton = appRoot.querySelector<HTMLButtonElement>('#switch-mode')
    const authForm = appRoot.querySelector<HTMLFormElement>('#auth-form')
    const fullNameInput = appRoot.querySelector<HTMLInputElement>('#full-name')
    const emailInput = appRoot.querySelector<HTMLInputElement>('#email')
    const passwordInput = appRoot.querySelector<HTMLInputElement>('#password')
    const togglePasswordButton = appRoot.querySelector<HTMLButtonElement>('#toggle-password')

    headerAuthAction?.addEventListener('click', () => {
      handleModeSwitch('sign-in')
      navigateTo('auth')
    })

    switchModeButton?.addEventListener('click', () => {
      handleModeSwitch(authState.mode === 'sign-in' ? 'sign-up' : 'sign-in')
    })

    fullNameInput?.addEventListener('input', (event) => {
      const target = event.currentTarget as HTMLInputElement | null

      authState.fullName = target?.value ?? ''
    })

    emailInput?.addEventListener('input', (event) => {
      const target = event.currentTarget as HTMLInputElement | null

      authState.email = target?.value ?? ''
    })

    passwordInput?.addEventListener('input', (event) => {
      const target = event.currentTarget as HTMLInputElement | null

      authState.password = target?.value ?? ''
    })

    togglePasswordButton?.addEventListener('click', () => {
      authState.showPassword = !authState.showPassword
      render()
    })

    authForm?.addEventListener('submit', (event) => {
      event.preventDefault()

      if (!isSupabaseConfigured) {
        setAuthNotice({
          tone: 'error',
          message: 'Supabase is not configured correctly. Check your .env file and restart the app.',
        })
        return
      }

      if (authState.mode === 'sign-up') {
        void handleSignUp()
        return
      }

      void handleSignIn()
    })
  }

  const bindStorefrontShellUi = () => {
    const storeShell = appRoot.querySelector<HTMLElement>('.store-shell')
    const menuToggle = appRoot.querySelector<HTMLButtonElement>('#header-menu-toggle')
    const primaryNav = appRoot.querySelector<HTMLElement>('#header-primary-nav')
    const dismissTargets = appRoot.querySelectorAll<HTMLElement>(
      '#header-primary-nav .nav-link, #header-primary-nav .nav-auth',
    )
    const isMobileViewport = () => window.matchMedia('(max-width: 900px)').matches

    const syncMenuState = (isOpen: boolean) => {
      if (!isMobileViewport()) {
        storeShell?.classList.remove('is-nav-open')
        menuToggle?.setAttribute('aria-expanded', 'false')
        primaryNav?.setAttribute('aria-hidden', 'false')
        return
      }

      storeShell?.classList.toggle('is-nav-open', isOpen)
      menuToggle?.setAttribute('aria-expanded', String(isOpen))
      primaryNav?.setAttribute('aria-hidden', String(!isOpen))
    }

    syncMenuState(false)

    menuToggle?.addEventListener('click', () => {
      const nextIsOpen = !storeShell?.classList.contains('is-nav-open')
      syncMenuState(Boolean(nextIsOpen))
    })

    dismissTargets.forEach((target) => {
      target.addEventListener('click', () => {
        syncMenuState(false)
      })
    })
  }

  const bindProfileUi = () => {
    const headerProfileAction = appRoot.querySelector<HTMLButtonElement>('#header-profile-action')
    const accountOverviewButton = appRoot.querySelector<HTMLButtonElement>('#profile-nav-overview')
    const orderHistoryButton = appRoot.querySelector<HTMLButtonElement>('#profile-nav-orders')
    const wishlistButton = appRoot.querySelector<HTMLButtonElement>('#profile-nav-wishlist')
    const accountSettingsButton = appRoot.querySelector<HTMLButtonElement>('#profile-nav-settings')
    const adminPortalButton = appRoot.querySelector<HTMLButtonElement>('#profile-nav-admin')
    const sidebarLogoutButton = appRoot.querySelector<HTMLButtonElement>('#sidebar-logout')
    const editProfileButton = appRoot.querySelector<HTMLButtonElement>('#edit-profile')
    const cancelProfileButton = appRoot.querySelector<HTMLButtonElement>('#cancel-profile')
    const profileForm = appRoot.querySelector<HTMLFormElement>('#profile-form')
    const fullNameInput = appRoot.querySelector<HTMLInputElement>('#profile-full-name')
    const phoneInput = appRoot.querySelector<HTMLInputElement>('#profile-phone')
    const emailPreferencesInput =
      appRoot.querySelector<HTMLInputElement>('#profile-email-preferences')
    const addressInput = appRoot.querySelector<HTMLTextAreaElement>('#profile-address')
    const sidebarLinks = Array.from(appRoot.querySelectorAll<HTMLButtonElement>('.sidebar-link'))

    const setActiveSidebarButton = (activeButton: HTMLButtonElement | null) => {
      sidebarLinks.forEach((button) => {
        button.classList.toggle('is-active', button === activeButton)
      })
    }

    const scrollToSection = (button: HTMLButtonElement | null, selector: string) => {
      const section = appRoot.querySelector<HTMLElement>(selector)

      if (!section) {
        return
      }

      setActiveSidebarButton(button)
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    headerProfileAction?.addEventListener('click', () => {
      profileState.notice = null
      navigateTo('profile')
    })

    accountOverviewButton?.addEventListener('click', () => {
      scrollToSection(accountOverviewButton, '#profile-overview-section')
    })

    orderHistoryButton?.addEventListener('click', () => {
      scrollToSection(orderHistoryButton, '#profile-orders-section')
    })

    wishlistButton?.addEventListener('click', () => {
      navigateTo('wishlist')
    })

    accountSettingsButton?.addEventListener('click', () => {
      scrollToSection(accountSettingsButton, '#profile-settings-section')
    })

    adminPortalButton?.addEventListener('click', () => {
      if (!isAdminUser()) {
        return
      }

      navigateTo('admin')
    })

    sidebarLogoutButton?.addEventListener('click', () => {
      void handleSignOut()
    })

    editProfileButton?.addEventListener('click', () => {
      handleStartEditing()
    })

    cancelProfileButton?.addEventListener('click', () => {
      handleCancelEditing()
    })

    fullNameInput?.addEventListener('input', (event) => {
      const target = event.currentTarget as HTMLInputElement | null

      profileState.form.fullName = target?.value ?? ''
    })

    phoneInput?.addEventListener('input', (event) => {
      const target = event.currentTarget as HTMLInputElement | null

      profileState.form.phone = target?.value ?? ''
    })

    emailPreferencesInput?.addEventListener('input', (event) => {
      const target = event.currentTarget as HTMLInputElement | null

      profileState.form.emailPreferences = target?.value ?? ''
    })

    addressInput?.addEventListener('input', (event) => {
      const target = event.currentTarget as HTMLTextAreaElement | null

      profileState.form.address = target?.value ?? ''
    })

    profileForm?.addEventListener('submit', (event) => {
      event.preventDefault()
      void handleSaveProfile()
    })
  }

  const bindHomeUi = () => {
    const homeNavLink = appRoot.querySelector<HTMLAnchorElement>('a[href="#home"]')
    const shopNavLink = appRoot.querySelector<HTMLAnchorElement>('a[href="#shop"]')
    const wishlistNavLink = appRoot.querySelector<HTMLAnchorElement>('a[href="#wishlist"]')
    const headerAuthAction = appRoot.querySelector<HTMLButtonElement>('#header-auth-action')
    const headerProfileAction = appRoot.querySelector<HTMLButtonElement>('#header-profile-action')
    const searchForm = appRoot.querySelector<HTMLFormElement>('#home-search-form')
    const searchInput = appRoot.querySelector<HTMLInputElement>('#home-search-input')
    const popularLinks = appRoot.querySelectorAll<HTMLButtonElement>('[data-search]')
    const productLinks = appRoot.querySelectorAll<HTMLElement>('[data-product-id]')
    const wishlistButtons = appRoot.querySelectorAll<HTMLButtonElement>('[data-wishlist-toggle]')
    const aboutCta = appRoot.querySelector<HTMLButtonElement>('#home-about-cta')

    homeNavLink?.addEventListener('click', (event) => {
      event.preventDefault()
      navigateTo('home')
    })

    shopNavLink?.addEventListener('click', (event) => {
      event.preventDefault()
      navigateTo('shop')
    })

    wishlistNavLink?.addEventListener('click', (event) => {
      event.preventDefault()
      navigateTo('wishlist')
    })

    headerAuthAction?.addEventListener('click', () => {
      handleModeSwitch('sign-in')
      navigateTo('auth')
    })

    headerProfileAction?.addEventListener('click', () => {
      navigateTo('profile')
    })

    productLinks.forEach((element) => {
      element.addEventListener('click', (event) => {
        event.preventDefault()

        const productId = element.dataset.productId

        if (!productId) {
          return
        }

        navigateTo('product', productId)
      })
    })

    wishlistButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const productId = button.dataset.wishlistToggle

        if (!productId) {
          return
        }

        if (!session) {
          handleModeSwitch('sign-in')
          setAuthNotice({ tone: 'info', message: 'Sign in to save items to your wishlist.' })
          navigateTo('auth')
          return
        }

        const size = getPreferredSize(productId)

        if (!size) {
          return
        }

        toggleWishlistItem({
          productId,
          size,
        })
        wishlistState.notice = null
        render()
      })
    })

    popularLinks.forEach((button) => {
      button.addEventListener('click', () => {
        const nextValue = button.dataset.search ?? ''

        if (searchInput) {
          searchInput.value = nextValue
        }

        applyShopSearch(nextValue)
      })
    })

    searchForm?.addEventListener('submit', (event) => {
      event.preventDefault()

      if (!searchInput) {
        return
      }

      applyShopSearch(searchInput.value)
    })

    aboutCta?.addEventListener('click', () => {
      window.location.href = 'https://www.instagram.com/corediski?igsh=NDRweXV0dHZsdXR6'
    })
  }

  const bindShopUi = () => {
    const homeNavLink = appRoot.querySelector<HTMLAnchorElement>('a[href="#home"]')
    const shopNavLink = appRoot.querySelector<HTMLAnchorElement>('a[href="#shop"]')
    const wishlistNavLink = appRoot.querySelector<HTMLAnchorElement>('a[href="#wishlist"]')
    const headerAuthAction = appRoot.querySelector<HTMLButtonElement>('#header-auth-action')
    const headerProfileAction = appRoot.querySelector<HTMLButtonElement>('#header-profile-action')
    const productLinks = appRoot.querySelectorAll<HTMLElement>('[data-product-id]')
    const wishlistButtons = appRoot.querySelectorAll<HTMLButtonElement>('[data-wishlist-toggle]')
    const searchInput = appRoot.querySelector<HTMLInputElement>('#shop-search-input')
    const eraSelect = appRoot.querySelector<HTMLSelectElement>('#shop-era-select')
    const priceSelect = appRoot.querySelector<HTMLSelectElement>('#shop-price-select')
    const sortSelect = appRoot.querySelector<HTMLSelectElement>('#shop-sort-select')
    const toolbar = appRoot.querySelector<HTMLFormElement>('#shop-toolbar')
    const toolbarReset = appRoot.querySelector<HTMLButtonElement>('#shop-toolbar-reset')
    const resetAll = appRoot.querySelector<HTMLButtonElement>('#shop-reset-all')
    const teamFilters = appRoot.querySelectorAll<HTMLInputElement>('.shop-team-filter')
    const teamFilterInputs = Array.from(teamFilters)

    homeNavLink?.addEventListener('click', (event) => {
      event.preventDefault()
      navigateTo('home')
    })

    shopNavLink?.addEventListener('click', (event) => {
      event.preventDefault()
      navigateTo('shop')
    })

    wishlistNavLink?.addEventListener('click', (event) => {
      event.preventDefault()
      navigateTo('wishlist')
    })

    headerAuthAction?.addEventListener('click', () => {
      handleModeSwitch('sign-in')
      navigateTo('auth')
    })

    headerProfileAction?.addEventListener('click', () => {
      navigateTo('profile')
    })

    productLinks.forEach((element) => {
      element.addEventListener('click', (event) => {
        event.preventDefault()

        const productId = element.dataset.productId

        if (!productId) {
          return
        }

        navigateTo('product', productId)
      })
    })

    wishlistButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const productId = button.dataset.wishlistToggle

        if (!productId) {
          return
        }

        if (!session) {
          handleModeSwitch('sign-in')
          setAuthNotice({ tone: 'info', message: 'Sign in to save items to your wishlist.' })
          navigateTo('auth')
          return
        }

        const size = getPreferredSize(productId)

        if (!size) {
          return
        }

        toggleWishlistItem({
          productId,
          size,
        })
        wishlistState.notice = null
        render()
      })
    })

    searchInput?.addEventListener('input', (event) => {
      const target = event.currentTarget as HTMLInputElement | null

      shopFilters.searchTerm = target?.value ?? ''
      render()
    })

    eraSelect?.addEventListener('change', (event) => {
      const target = event.currentTarget as HTMLSelectElement | null

      shopFilters.era = (target?.value as ShopEra | 'all' | undefined) ?? 'all'
      render()
    })

    priceSelect?.addEventListener('change', (event) => {
      const target = event.currentTarget as HTMLSelectElement | null

      shopFilters.priceRange = (target?.value as PriceRange | undefined) ?? 'all'
      render()
    })

    sortSelect?.addEventListener('change', (event) => {
      const target = event.currentTarget as HTMLSelectElement | null

      shopFilters.sortBy = (target?.value as SortOption | undefined) ?? 'most-popular'
      render()
    })

    teamFilterInputs.forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        shopFilters.selectedTeams = teamFilterInputs
          .filter((input) => input.checked)
          .map((input) => input.value)

        render()
      })
    })

    toolbar?.addEventListener('submit', (event) => {
      event.preventDefault()
      render()
    })

    const resetFilters = () => {
      resetShopFilters()
      render()
    }

    toolbarReset?.addEventListener('click', resetFilters)
    resetAll?.addEventListener('click', resetFilters)
  }

  const bindProductUi = () => {
    const activeProduct = currentProductId
      ? shopCatalog.find((item) => item.id === currentProductId) ?? null
      : null
    const homeNavLink = appRoot.querySelector<HTMLAnchorElement>('a[href="#home"]')
    const shopNavLink = appRoot.querySelector<HTMLAnchorElement>('a[href="#shop"]')
    const wishlistNavLink = appRoot.querySelector<HTMLAnchorElement>('a[href="#wishlist"]')
    const headerAuthAction = appRoot.querySelector<HTMLButtonElement>('#header-auth-action')
    const headerProfileAction = appRoot.querySelector<HTMLButtonElement>('#header-profile-action')
    const sizeButtons = appRoot.querySelectorAll<HTMLButtonElement>('[data-size]')
    const relatedCards = appRoot.querySelectorAll<HTMLButtonElement>('[data-product-id]')
    const addToCartButton = appRoot.querySelector<HTMLButtonElement>('#product-add-to-cart')
    const addToWishlistButton = appRoot.querySelector<HTMLButtonElement>('#product-add-to-wishlist')

    homeNavLink?.addEventListener('click', (event) => {
      event.preventDefault()
      navigateTo('home')
    })

    shopNavLink?.addEventListener('click', (event) => {
      event.preventDefault()
      navigateTo('shop')
    })

    wishlistNavLink?.addEventListener('click', (event) => {
      event.preventDefault()
      navigateTo('wishlist')
    })

    headerAuthAction?.addEventListener('click', () => {
      handleModeSwitch('sign-in')
      navigateTo('auth')
    })

    headerProfileAction?.addEventListener('click', () => {
      navigateTo('profile')
    })

    sizeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const size = button.dataset.size as ShirtSize | undefined

        if (!size) {
          return
        }

        selectedProductSize = size
        render()
      })
    })

    relatedCards.forEach((button) => {
      button.addEventListener('click', () => {
        const productId = button.dataset.productId

        if (!productId) {
          return
        }

        navigateTo('product', productId)
      })
    })

    addToCartButton?.addEventListener('click', () => {
      if (!session || !activeProduct) {
        handleModeSwitch('sign-in')
        setAuthNotice({ tone: 'info', message: 'Sign in to add items to your cart.' })
        navigateTo('auth')
        return
      }

      addCartItem({
        productId: activeProduct.id,
        quantity: 1,
        size: selectedProductSize,
      })
      cartState.notice = {
        tone: 'success',
        message: `${activeProduct.name} (${selectedProductSize}) added to your cart.`,
      }
      navigateTo('cart')
    })

    addToWishlistButton?.addEventListener('click', () => {
      if (!session || !activeProduct) {
        handleModeSwitch('sign-in')
        setAuthNotice({ tone: 'info', message: 'Sign in to save items to your wishlist.' })
        navigateTo('auth')
        return
      }

      const nextIsWishlisted = !isWishlisted(activeProduct.id)

      toggleWishlistItem({
        productId: activeProduct.id,
        size: selectedProductSize,
      })
      setWishlistNotice({
        tone: nextIsWishlisted ? 'success' : 'info',
        message: nextIsWishlisted
          ? `${activeProduct.name} added to your wishlist.`
          : `${activeProduct.name} removed from your wishlist.`,
      })
    })
  }

  const bindWishlistUi = () => {
    const headerAuthAction = appRoot.querySelector<HTMLButtonElement>('#header-auth-action')
    const headerProfileAction = appRoot.querySelector<HTMLButtonElement>('#header-profile-action')
    const removeButtons = appRoot.querySelectorAll<HTMLButtonElement>('[data-wishlist-remove]')
    const addToCartButtons =
      appRoot.querySelectorAll<HTMLButtonElement>('[data-wishlist-add-to-cart]')

    headerAuthAction?.addEventListener('click', () => {
      handleModeSwitch('sign-in')
      navigateTo('auth')
    })

    headerProfileAction?.addEventListener('click', () => {
      navigateTo('profile')
    })

    removeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const lineId = button.dataset.wishlistRemove

        if (!lineId) {
          return
        }

        removeWishlistLine(lineId)
        setWishlistNotice({ tone: 'info', message: 'Item removed from your wishlist.' })
      })
    })

    addToCartButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const lineId = button.dataset.wishlistAddToCart

        if (!lineId) {
          return
        }

        const [productId, size] = lineId.split(':') as [string | undefined, ShirtSize | undefined]

        if (!productId || !size) {
          return
        }

        addCartItem({
          productId,
          quantity: 1,
          size,
        })
        cartState.notice = {
          tone: 'success',
          message: 'Item added to your cart.',
        }
        navigateTo('cart')
      })
    })
  }

  const bindCartUi = () => {
    const headerAuthAction = appRoot.querySelector<HTMLButtonElement>('#header-auth-action')
    const headerProfileAction = appRoot.querySelector<HTMLButtonElement>('#header-profile-action')
    const checkoutButton = appRoot.querySelector<HTMLButtonElement>('#cart-checkout')
    const clearButton = appRoot.querySelector<HTMLButtonElement>('#cart-clear')
    const removeButtons = appRoot.querySelectorAll<HTMLButtonElement>('[data-cart-remove]')
    const increaseButtons = appRoot.querySelectorAll<HTMLButtonElement>('[data-cart-increase]')
    const decreaseButtons = appRoot.querySelectorAll<HTMLButtonElement>('[data-cart-decrease]')

    headerAuthAction?.addEventListener('click', () => {
      handleModeSwitch('sign-in')
      navigateTo('auth')
    })

    headerProfileAction?.addEventListener('click', () => {
      navigateTo('profile')
    })

    removeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const lineId = button.dataset.cartRemove

        if (!lineId) {
          return
        }

        removeCartLine(lineId)
        setCartNotice({ tone: 'info', message: 'Item removed from your cart.' })
      })
    })

    increaseButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const lineId = button.dataset.cartIncrease

        if (!lineId) {
          return
        }

        cartState.notice = null
        updateCartQuantity(lineId, 1)
        render()
      })
    })

    decreaseButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const lineId = button.dataset.cartDecrease

        if (!lineId) {
          return
        }

        cartState.notice = null
        updateCartQuantity(lineId, -1)
        render()
      })
    })

    clearButton?.addEventListener('click', () => {
      clearCart()
      setCartNotice({ tone: 'info', message: 'Your cart has been cleared.' })
    })

    checkoutButton?.addEventListener('click', () => {
      if (!cartState.items.length) {
        setCartNotice({ tone: 'error', message: 'Your cart is empty.' })
        return
      }

      checkoutState.notice = null
      navigateTo('checkout')
    })
  }

  const bindCheckoutUi = () => {
    const headerAuthAction = appRoot.querySelector<HTMLButtonElement>('#header-auth-action')
    const headerProfileAction = appRoot.querySelector<HTMLButtonElement>('#header-profile-action')
    const editProfileButton = appRoot.querySelector<HTMLButtonElement>('#checkout-edit-profile')
    const shippingAddressInput =
      appRoot.querySelector<HTMLTextAreaElement>('#checkout-shipping-address')
    const billingAddressInput =
      appRoot.querySelector<HTMLTextAreaElement>('#checkout-billing-address')
    const billingSameInput = appRoot.querySelector<HTMLInputElement>('#checkout-billing-same')
    const checkoutForm = appRoot.querySelector<HTMLFormElement>('#checkout-form')

    headerAuthAction?.addEventListener('click', () => {
      handleModeSwitch('sign-in')
      navigateTo('auth')
    })

    headerProfileAction?.addEventListener('click', () => {
      navigateTo('profile')
    })

    editProfileButton?.addEventListener('click', () => {
      navigateTo('profile')
    })

    shippingAddressInput?.addEventListener('input', (event) => {
      const target = event.currentTarget as HTMLTextAreaElement | null

      checkoutState.form.shippingAddress = target?.value ?? ''

      if (checkoutState.form.billingSameAsShipping) {
        checkoutState.form.billingAddress = checkoutState.form.shippingAddress
      }
    })

    billingSameInput?.addEventListener('change', (event) => {
      const target = event.currentTarget as HTMLInputElement | null

      checkoutState.form.billingSameAsShipping = target?.checked ?? true

      if (checkoutState.form.billingSameAsShipping) {
        checkoutState.form.billingAddress = checkoutState.form.shippingAddress
      }

      render()
    })

    billingAddressInput?.addEventListener('input', (event) => {
      const target = event.currentTarget as HTMLTextAreaElement | null

      checkoutState.form.billingAddress = target?.value ?? ''
    })

    checkoutForm?.addEventListener('submit', async (event) => {
      event.preventDefault()

      if (!cartState.items.length) {
        setCheckoutNotice({ tone: 'error', message: 'Your cart is empty.' })
        navigateTo('cart')
        return
      }

      if (!checkoutState.form.shippingAddress.trim()) {
        setCheckoutNotice({ tone: 'error', message: 'Enter your shipping address to continue.' })
        return
      }

      if (
        !checkoutState.form.billingSameAsShipping &&
        !checkoutState.form.billingAddress.trim()
      ) {
        setCheckoutNotice({ tone: 'error', message: 'Enter your billing address to continue.' })
        return
      }

      if (!session) {
        setCheckoutNotice({ tone: 'error', message: 'Sign in again to complete checkout.' })
        return
      }

      const order: OrderRecord = {
        createdAt: new Date().toISOString(),
        email: session.user.email ?? profileState.profile?.email ?? 'No email address',
        id: `CD-${Date.now().toString().slice(-6)}`,
        items: getCartLineItems(cartState.items),
        paymentStatus: 'awaiting_approval',
        shippingAddress: checkoutState.form.shippingAddress.trim(),
        status: 'pending',
        total: getCartTotal(cartState.items),
        userId: session.user.id,
      }

      let persistedOrder = order

      if (isSupabaseConfigured) {
        const { data, error } = await createOrderRecord(order)

        if (error || !data) {
          setCheckoutNotice({
            tone: 'error',
            message: error?.message ?? 'Unable to save this order to Supabase right now.',
          })
          return
        }

        persistedOrder = data
      }

      orderState.items = [persistedOrder, ...orderState.items]
      persistOrders()
      syncProfileOrders(session.user.id)
      clearCart()
      checkoutState.notice = null
      profileState.notice = {
        tone: 'info',
        message: `Order ${persistedOrder.id} is awaiting payment approval. It will only move into processing once an admin confirms payment.`,
      }
      navigateTo('profile')
    })
  }

  const bindAdminUi = () => {
    const homeButton = appRoot.querySelector<HTMLButtonElement>('#admin-home')
    const storefrontButton = appRoot.querySelector<HTMLButtonElement>('#admin-storefront')
    const signOutButton = appRoot.querySelector<HTMLButtonElement>('#admin-signout')
    const sidebarHomeButton = appRoot.querySelector<HTMLButtonElement>('#admin-sidebar-home')
    const sidebarStorefrontButton =
      appRoot.querySelector<HTMLButtonElement>('#admin-sidebar-storefront')
    const supportButton = appRoot.querySelector<HTMLButtonElement>('#admin-sidebar-support')
    const dashboardButton = appRoot.querySelector<HTMLButtonElement>('#admin-nav-dashboard')
    const productsButton = appRoot.querySelector<HTMLButtonElement>('#admin-nav-products')
    const ordersButton = appRoot.querySelector<HTMLButtonElement>('#admin-nav-orders')
    const customersButton = appRoot.querySelector<HTMLButtonElement>('#admin-nav-customers')
    const categoriesButton = appRoot.querySelector<HTMLButtonElement>('#admin-nav-categories')
    const analyticsButton = appRoot.querySelector<HTMLButtonElement>('#admin-nav-analytics')
    const settingsButton = appRoot.querySelector<HTMLButtonElement>('#admin-nav-settings')
    const searchInput = appRoot.querySelector<HTMLInputElement>('#admin-search-input')
    const orderSearchInput = appRoot.querySelector<HTMLInputElement>('#admin-order-search-input')
    const orderFilterForm = appRoot.querySelector<HTMLFormElement>('#admin-order-filter-form')
    const orderStatusFilter =
      appRoot.querySelector<HTMLSelectElement>('#admin-order-status-filter')
    const customerSearchInput =
      appRoot.querySelector<HTMLInputElement>('#admin-customer-search-input')
    const customerFilterForm = appRoot.querySelector<HTMLFormElement>('#admin-customer-filter-form')
    const customerRoleFilter =
      appRoot.querySelector<HTMLSelectElement>('#admin-customer-role-filter')
    const approveOrderButtons =
      appRoot.querySelectorAll<HTMLButtonElement>('[data-admin-approve-order]')
    const shipOrderButtons = appRoot.querySelectorAll<HTMLButtonElement>('[data-admin-ship-order]')
    const completeOrderButtons =
      appRoot.querySelectorAll<HTMLButtonElement>('[data-admin-complete-order]')
    const promoteCustomerButtons = appRoot.querySelectorAll<HTMLButtonElement>(
      '[data-admin-promote-customer]',
    )
    const demoteCustomerButtons = appRoot.querySelectorAll<HTMLButtonElement>(
      '[data-admin-demote-customer]',
    )
    const removeCustomerButtons = appRoot.querySelectorAll<HTMLButtonElement>(
      '[data-admin-remove-customer]',
    )
    const productForm = appRoot.querySelector<HTMLFormElement>('#admin-product-form')
    const clubOrNationInput = appRoot.querySelector<HTMLInputElement>('#admin-club-or-nation')
    const productTitleInput = appRoot.querySelector<HTMLInputElement>('#admin-product-title')
    const seasonInput = appRoot.querySelector<HTMLInputElement>('#admin-season')
    const variantInput = appRoot.querySelector<HTMLInputElement>('#admin-variant')
    const priceInput = appRoot.querySelector<HTMLInputElement>('#admin-price')
    const imageUrlInput = appRoot.querySelector<HTMLInputElement>('#admin-image-url')
    const leagueInput = appRoot.querySelector<HTMLInputElement>('#admin-league')
    const conditionInput = appRoot.querySelector<HTMLSelectElement>('#admin-condition')
    const authenticityInput = appRoot.querySelector<HTMLSelectElement>('#admin-authenticity')
    const tagsInput = appRoot.querySelector<HTMLInputElement>('#admin-tags')
    const featuredInput = appRoot.querySelector<HTMLInputElement>('#admin-featured')
    const cancelEditButton = appRoot.querySelector<HTMLButtonElement>('#admin-cancel-edit')
    const settingsForm = appRoot.querySelector<HTMLFormElement>('#admin-settings-form')
    const settingsStoreNameInput =
      appRoot.querySelector<HTMLInputElement>('#admin-settings-store-name')
    const settingsSupportEmailInput =
      appRoot.querySelector<HTMLInputElement>('#admin-settings-support-email')
    const settingsSupportPhoneInput =
      appRoot.querySelector<HTMLInputElement>('#admin-settings-support-phone')
    const settingsCurrencyInput =
      appRoot.querySelector<HTMLSelectElement>('#admin-settings-currency')
    const settingsTaxRateInput =
      appRoot.querySelector<HTMLInputElement>('#admin-settings-tax-rate')
    const settingsFlatShippingRateInput = appRoot.querySelector<HTMLInputElement>(
      '#admin-settings-flat-shipping-rate',
    )
    const settingsLowStockThresholdInput = appRoot.querySelector<HTMLInputElement>(
      '#admin-settings-low-stock-threshold',
    )
    const settingsSendAdminNotificationsInput = appRoot.querySelector<HTMLInputElement>(
      '#admin-settings-send-admin-notifications',
    )
    const settingsMaintenanceModeInput = appRoot.querySelector<HTMLInputElement>(
      '#admin-settings-maintenance-mode',
    )
    const settingsRequireDoubleOptInInput = appRoot.querySelector<HTMLInputElement>(
      '#admin-settings-require-double-opt-in',
    )
    const resetSettingsButton = appRoot.querySelector<HTMLButtonElement>('#admin-reset-settings')
    const editButtons = appRoot.querySelectorAll<HTMLButtonElement>('[data-admin-edit-product]')
    const sidebarButtons = Array.from(
      appRoot.querySelectorAll<HTMLButtonElement>('.admin-sidebar-link'),
    )

    const setActiveAdminSidebarButton = (activeButton: HTMLButtonElement | null) => {
      sidebarButtons.forEach((button) => {
        button.classList.toggle('is-active', button === activeButton)
      })
    }

    const scrollAdminSection = (button: HTMLButtonElement | null, selector: string) => {
      const section = appRoot.querySelector<HTMLElement>(selector)

      if (!section) {
        return
      }

      setActiveAdminSidebarButton(button)
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const openAdminProductsView = () => {
      adminState.activeView = 'products'
      render()
    }

    homeButton?.addEventListener('click', () => {
      navigateTo('admin')
    })

    storefrontButton?.addEventListener('click', () => {
      navigateTo('home')
    })

    sidebarHomeButton?.addEventListener('click', () => {
      navigateTo('admin')
    })

    sidebarStorefrontButton?.addEventListener('click', () => {
      navigateTo('home')
    })

    supportButton?.addEventListener('click', () => {
      const supportEmail = adminState.settingsForm.supportEmail.trim() || 'support@corediski.com'

      window.location.href = `mailto:${encodeURIComponent(supportEmail)}`
    })

    signOutButton?.addEventListener('click', () => {
      void handleSignOut()
    })

    dashboardButton?.addEventListener('click', () => {
      adminState.activeView = 'dashboard'
      render()
    })

    productsButton?.addEventListener('click', () => {
      openAdminProductsView()
    })

    ordersButton?.addEventListener('click', () => {
      adminState.activeView = 'orders'
      render()
    })

    customersButton?.addEventListener('click', () => {
      adminState.activeView = 'customers'
      render()
    })

    categoriesButton?.addEventListener('click', () => {
      if (adminState.activeView !== 'dashboard') {
        adminState.activeView = 'dashboard'
        render()
        return
      }

      scrollAdminSection(categoriesButton, '#admin-categories-section')
    })

    analyticsButton?.addEventListener('click', () => {
      adminState.activeView = 'analytics'
      render()
    })

    settingsButton?.addEventListener('click', () => {
      adminState.activeView = 'settings'
      render()
    })

    searchInput?.addEventListener('input', (event) => {
      const target = event.currentTarget as HTMLInputElement | null

      adminSearchTerm = target?.value ?? ''
      render()
    })

    orderSearchInput?.addEventListener('input', (event) => {
      const target = event.currentTarget as HTMLInputElement | null

      adminSearchTerm = target?.value ?? ''
    })

    orderStatusFilter?.addEventListener('change', (event) => {
      const target = event.currentTarget as HTMLSelectElement | null

      adminState.orderFilter =
        target?.value === 'paid' || target?.value === 'awaiting_approval' ? target.value : 'all'
    })

    orderFilterForm?.addEventListener('submit', (event) => {
      event.preventDefault()
      adminState.activeView = 'orders'
      render()
    })

    customerSearchInput?.addEventListener('input', (event) => {
      const target = event.currentTarget as HTMLInputElement | null

      adminSearchTerm = target?.value ?? ''
    })

    customerRoleFilter?.addEventListener('change', (event) => {
      const target = event.currentTarget as HTMLSelectElement | null

      adminState.customerFilter =
        target?.value === 'admin' || target?.value === 'customer' ? target.value : 'all'
    })

    customerFilterForm?.addEventListener('submit', (event) => {
      event.preventDefault()
      adminState.activeView = 'customers'
      render()
    })

    settingsStoreNameInput?.addEventListener('input', (event) => {
      adminState.settingsForm.storeName = (event.currentTarget as HTMLInputElement).value
    })

    settingsSupportEmailInput?.addEventListener('input', (event) => {
      adminState.settingsForm.supportEmail = (event.currentTarget as HTMLInputElement).value
    })

    settingsSupportPhoneInput?.addEventListener('input', (event) => {
      adminState.settingsForm.supportPhone = (event.currentTarget as HTMLInputElement).value
    })

    settingsCurrencyInput?.addEventListener('change', (event) => {
      const nextCurrency = (event.currentTarget as HTMLSelectElement).value

      adminState.settingsForm.currency =
        nextCurrency === 'USD' || nextCurrency === 'EUR' || nextCurrency === 'GBP' ? nextCurrency : 'ZAR'
    })

    settingsTaxRateInput?.addEventListener('input', (event) => {
      adminState.settingsForm.taxRate = (event.currentTarget as HTMLInputElement).value
    })

    settingsFlatShippingRateInput?.addEventListener('input', (event) => {
      adminState.settingsForm.flatShippingRate = (event.currentTarget as HTMLInputElement).value
    })

    settingsLowStockThresholdInput?.addEventListener('input', (event) => {
      adminState.settingsForm.lowStockThreshold = (event.currentTarget as HTMLInputElement).value
    })

    settingsSendAdminNotificationsInput?.addEventListener('change', (event) => {
      adminState.settingsForm.sendAdminNotifications = (event.currentTarget as HTMLInputElement).checked
    })

    settingsMaintenanceModeInput?.addEventListener('change', (event) => {
      adminState.settingsForm.maintenanceMode = (event.currentTarget as HTMLInputElement).checked
    })

    settingsRequireDoubleOptInInput?.addEventListener('change', (event) => {
      adminState.settingsForm.requireNewsletterDoubleOptIn = (
        event.currentTarget as HTMLInputElement
      ).checked
    })

    settingsForm?.addEventListener('submit', async (event) => {
      event.preventDefault()

      const storeName = adminState.settingsForm.storeName.trim()
      const supportEmail = adminState.settingsForm.supportEmail.trim().toLowerCase()
      const supportPhone = adminState.settingsForm.supportPhone.trim()
      const taxRate = Number(adminState.settingsForm.taxRate)
      const flatShippingRate = Number(adminState.settingsForm.flatShippingRate)
      const lowStockThreshold = Number(adminState.settingsForm.lowStockThreshold)

      if (!storeName) {
        adminState.notice = {
          tone: 'error',
          message: 'Enter a store name before saving settings.',
        }
        render()
        return
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) {
        adminState.notice = {
          tone: 'error',
          message: 'Enter a valid support email before saving settings.',
        }
        render()
        return
      }

      if (!supportPhone) {
        adminState.notice = {
          tone: 'error',
          message: 'Enter a support phone number before saving settings.',
        }
        render()
        return
      }

      if (Number.isNaN(taxRate) || taxRate < 0) {
        adminState.notice = {
          tone: 'error',
          message: 'Tax rate must be 0 or greater.',
        }
        render()
        return
      }

      if (Number.isNaN(flatShippingRate) || flatShippingRate < 0) {
        adminState.notice = {
          tone: 'error',
          message: 'Flat shipping rate must be 0 or greater.',
        }
        render()
        return
      }

      if (Number.isNaN(lowStockThreshold) || lowStockThreshold < 1) {
        adminState.notice = {
          tone: 'error',
          message: 'Low stock threshold must be at least 1.',
        }
        render()
        return
      }

      adminState.settingsForm = {
        ...adminState.settingsForm,
        flatShippingRate: `${flatShippingRate}`,
        lastUpdatedAt: new Date().toISOString(),
        lowStockThreshold: `${Math.round(lowStockThreshold)}`,
        storeName,
        supportEmail,
        supportPhone,
        taxRate: `${taxRate}`,
      }

      if (isSupabaseConfigured && session) {
        const { data, error } = await upsertStoreSettings(adminState.settingsForm, session.user.id)

        if (error || !data) {
          adminState.notice = {
            tone: 'error',
            message: error?.message ?? 'Unable to save store settings to Supabase right now.',
          }
          render()
          return
        }

        adminState.settingsForm = data
      }

      writeAdminSettings(adminState.settingsForm)
      adminState.activeView = 'settings'
      adminState.notice = {
        tone: 'success',
        message: 'Store settings saved successfully.',
      }
      render()
    })

    resetSettingsButton?.addEventListener('click', async () => {
      adminState.settingsForm = createDefaultAdminSettingsForm()

      if (isSupabaseConfigured && session) {
        const { data, error } = await upsertStoreSettings(adminState.settingsForm, session.user.id)

        if (error || !data) {
          adminState.notice = {
            tone: 'error',
            message: error?.message ?? 'Unable to reset store settings in Supabase right now.',
          }
          render()
          return
        }

        adminState.settingsForm = data
      }

      writeAdminSettings(adminState.settingsForm)
      adminState.activeView = 'settings'
      adminState.notice = {
        tone: 'info',
        message: 'Store settings were reset to defaults.',
      }
      render()
    })

    const handleCustomerRoleChange = async (
      profileId: string,
      role: 'admin' | 'customer',
      successMessage: string,
    ) => {
      const { data, error } = await updateProfileRole(profileId, role)

      if (error || !data) {
        adminState.notice = {
          tone: 'error',
          message: error?.message ?? 'Unable to update this customer role right now.',
        }
        render()
        return
      }

      upsertAdminProfile(data)

      if (profileState.profile?.id === data.id) {
        profileState.profile = data
        syncProfileForm(data)
      }

      if (profileState.profile?.id === data.id && data.role !== 'admin') {
        profileState.notice = {
          tone: 'success',
          message: 'Your admin access was removed. You can continue from your profile page.',
        }
        navigateTo('profile')
        return
      }

      adminState.notice = {
        tone: 'success',
        message: successMessage,
      }
      render()
    }

    const handleCustomerRemoval = async (profileId: string) => {
      const { data, error } = await updateProfileActiveStatus(profileId, false)

      if (error || !data) {
        adminState.notice = {
          tone: 'error',
          message: error?.message ?? 'Unable to remove this account right now.',
        }
        render()
        return
      }

      upsertAdminProfile(data)

      if (profileState.profile?.id === data.id) {
        await signOutCurrentUser()
        handleSignedOutState({
          tone: 'info',
          message: 'Your account has been removed and signed out.',
        })
        return
      }

      adminState.notice = {
        tone: 'success',
        message: 'Customer account removed successfully.',
      }
      render()
    }

    approveOrderButtons.forEach((button) => {
      button.addEventListener('click', async () => {
        const orderId = button.dataset.adminApproveOrder

        if (!orderId) {
          return
        }

        const order = orderState.items.find((item) => item.id === orderId)

        if (!order) {
          return
        }

        const nextOrder: OrderRecord = {
          ...order,
          paymentStatus: 'paid',
        }

        if (isSupabaseConfigured) {
          const { data, error } = await updateOrderRecord(nextOrder)

          if (error || !data) {
            adminState.notice = {
              tone: 'error',
              message: error?.message ?? 'Unable to update this order in Supabase right now.',
            }
            render()
            return
          }

          Object.assign(order, data)
        } else {
          Object.assign(order, nextOrder)
        }

        persistOrders()
        if (session) {
          syncProfileOrders(session.user.id)
        }
        adminState.notice = {
          tone: 'success',
          message: `Payment approved for ${order.id}. The order is now officially placed.`,
        }
        render()
      })
    })

    shipOrderButtons.forEach((button) => {
      button.addEventListener('click', async () => {
        const orderId = button.dataset.adminShipOrder

        if (!orderId) {
          return
        }

        const order = orderState.items.find((item) => item.id === orderId)

        if (!order || order.paymentStatus !== 'paid') {
          return
        }

        const nextOrder: OrderRecord = {
          ...order,
          status: 'shipped',
        }

        if (isSupabaseConfigured) {
          const { data, error } = await updateOrderRecord(nextOrder)

          if (error || !data) {
            adminState.notice = {
              tone: 'error',
              message: error?.message ?? 'Unable to update this order in Supabase right now.',
            }
            render()
            return
          }

          Object.assign(order, data)
        } else {
          Object.assign(order, nextOrder)
        }

        persistOrders()
        if (session) {
          syncProfileOrders(session.user.id)
        }
        adminState.notice = {
          tone: 'success',
          message: `${order.id} marked as shipped.`,
        }
        render()
      })
    })

    completeOrderButtons.forEach((button) => {
      button.addEventListener('click', async () => {
        const orderId = button.dataset.adminCompleteOrder

        if (!orderId) {
          return
        }

        const order = orderState.items.find((item) => item.id === orderId)

        if (!order || order.paymentStatus !== 'paid') {
          return
        }

        const nextOrder: OrderRecord = {
          ...order,
          status: 'completed',
        }

        if (isSupabaseConfigured) {
          const { data, error } = await updateOrderRecord(nextOrder)

          if (error || !data) {
            adminState.notice = {
              tone: 'error',
              message: error?.message ?? 'Unable to update this order in Supabase right now.',
            }
            render()
            return
          }

          Object.assign(order, data)
        } else {
          Object.assign(order, nextOrder)
        }

        persistOrders()
        if (session) {
          syncProfileOrders(session.user.id)
        }
        adminState.notice = {
          tone: 'success',
          message: `${order.id} marked as completed.`,
        }
        render()
      })
    })

    promoteCustomerButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const profileId = button.dataset.adminPromoteCustomer

        if (!profileId) {
          return
        }

        void handleCustomerRoleChange(profileId, 'admin', 'Customer promoted to admin.')
      })
    })

    demoteCustomerButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const profileId = button.dataset.adminDemoteCustomer

        if (!profileId) {
          return
        }

        void handleCustomerRoleChange(profileId, 'customer', 'Admin account demoted to customer.')
      })
    })

    removeCustomerButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const profileId = button.dataset.adminRemoveCustomer

        if (!profileId) {
          return
        }

        void handleCustomerRemoval(profileId)
      })
    })

    clubOrNationInput?.addEventListener('input', (event) => {
      adminState.form.clubOrNation = (event.currentTarget as HTMLInputElement).value
    })

    productTitleInput?.addEventListener('input', (event) => {
      adminState.form.productTitle = (event.currentTarget as HTMLInputElement).value
    })

    seasonInput?.addEventListener('input', (event) => {
      adminState.form.season = (event.currentTarget as HTMLInputElement).value
    })

    variantInput?.addEventListener('input', (event) => {
      adminState.form.variant = (event.currentTarget as HTMLInputElement).value
    })

    priceInput?.addEventListener('input', (event) => {
      adminState.form.price = (event.currentTarget as HTMLInputElement).value
    })

    imageUrlInput?.addEventListener('input', (event) => {
      adminState.form.imageUrl = (event.currentTarget as HTMLInputElement).value
    })

    leagueInput?.addEventListener('input', (event) => {
      adminState.form.league = (event.currentTarget as HTMLInputElement).value
    })

    conditionInput?.addEventListener('change', (event) => {
      adminState.form.condition = (event.currentTarget as HTMLSelectElement).value
    })

    authenticityInput?.addEventListener('change', (event) => {
      adminState.form.authenticity = (event.currentTarget as HTMLSelectElement).value
    })

    tagsInput?.addEventListener('input', (event) => {
      adminState.form.tags = (event.currentTarget as HTMLInputElement).value
    })

    featuredInput?.addEventListener('change', (event) => {
      adminState.form.isFeatured = (event.currentTarget as HTMLInputElement).checked
    })

    cancelEditButton?.addEventListener('click', () => {
      resetAdminProductForm()
      adminState.notice = null
      render()
    })

    editButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const productId = button.dataset.adminEditProduct

        if (!productId) {
          return
        }

        const product = shopCatalog.find((item) => item.id === productId)

        if (!product) {
          return
        }

        adminState.activeView = 'products'
        adminState.editingProductId = product.id
        adminState.form = {
          authenticity: product.authenticity,
          clubOrNation: product.clubOrNation,
          condition: product.condition,
          imageUrl: product.imageUrl ?? '',
          isFeatured: product.isFeatured,
          league: product.league,
          price: `${product.price}`,
          productTitle: product.name,
          season: product.seasonLabel.replace(` ${product.variant}`, ''),
          tags: product.tags.join(', '),
          variant: product.variant,
        }
        adminState.notice = {
          tone: 'info',
          message: `Editing ${product.name}. Update the fields below and save.`,
        }
        render()
      })
    })

    productForm?.addEventListener('submit', async (event) => {
      event.preventDefault()

      const clubOrNation = adminState.form.clubOrNation.trim()
      const productTitle = adminState.form.productTitle.trim()
      const season = adminState.form.season.trim()
      const variant = adminState.form.variant.trim()
      const league = adminState.form.league.trim()
      const condition = adminState.form.condition.trim()
      const authenticity = adminState.form.authenticity.trim()
      const price = Number(adminState.form.price)
      const year = parseAdminSeasonStart(season)

      if (
        !clubOrNation ||
        !productTitle ||
        !season ||
        !variant ||
        !league ||
        !condition ||
        !authenticity ||
        !year ||
        Number.isNaN(price) ||
        price <= 0
      ) {
        adminState.notice = {
          tone: 'error',
          message:
            'Complete club, title, season, variant, league, condition, authenticity, and a valid price before saving.',
        }
        render()
        return
      }

      const existingProduct = adminState.editingProductId
        ? shopCatalog.find((item) => item.id === adminState.editingProductId) ?? null
        : null

      const nextProduct = buildAdminProduct({
        authenticity,
        clubOrNation,
        condition,
        existingId: existingProduct?.id,
        imageTheme: existingProduct?.imageTheme,
        imageUrl: adminState.form.imageUrl,
        isFeatured: adminState.form.isFeatured,
        league,
        price,
        productTitle,
        tags: adminState.form.tags
          .split(',')
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean),
        variant,
        year,
      })

      if (existingProduct) {
        nextProduct.availableSizes = existingProduct.availableSizes
        nextProduct.description = existingProduct.description
        nextProduct.freeShipping = existingProduct.freeShipping
        nextProduct.isWishlisted = existingProduct.isWishlisted
      }

      nextProduct.seasonLabel = `${season} ${variant}`
      let persistedProduct = nextProduct

      if (isSupabaseConfigured && session) {
        const { data, error } = await upsertStoreProduct(nextProduct, session.user.id)

        if (error || !data) {
          adminState.notice = {
            tone: 'error',
            message: error?.message ?? 'Unable to save this product to Supabase right now.',
          }
          render()
          return
        }

        persistedProduct = data
      }

      upsertShopProduct(persistedProduct)
      resetAdminProductForm()
      adminState.activeView = 'products'
      adminState.notice = {
        tone: 'success',
        message: existingProduct ? 'Product updated successfully.' : 'Product added successfully.',
      }
      render()
    })
  }

  const bindAdminShellUi = () => {
    const adminShell = appRoot.querySelector<HTMLElement>('.admin-shell')
    const menuToggle = appRoot.querySelector<HTMLButtonElement>('#admin-mobile-menu-toggle')
    const topNav = appRoot.querySelector<HTMLElement>('#admin-primary-nav')
    const sidebar = appRoot.querySelector<HTMLElement>('.admin-sidebar')
    const dismissTargets = appRoot.querySelectorAll<HTMLElement>(
      '#admin-primary-nav .admin-topnav-button, .admin-sidebar .admin-sidebar-link, .admin-sidebar .admin-sidebar-utility',
    )
    const isMobileViewport = () => window.matchMedia('(max-width: 900px)').matches

    const syncMenuState = (isOpen: boolean) => {
      if (!isMobileViewport()) {
        adminShell?.classList.remove('is-mobile-nav-open')
        menuToggle?.setAttribute('aria-expanded', 'false')
        topNav?.setAttribute('aria-hidden', 'false')
        sidebar?.setAttribute('aria-hidden', 'false')
        return
      }

      adminShell?.classList.toggle('is-mobile-nav-open', isOpen)
      menuToggle?.setAttribute('aria-expanded', String(isOpen))
      topNav?.setAttribute('aria-hidden', String(!isOpen))
      sidebar?.setAttribute('aria-hidden', String(!isOpen))
    }

    syncMenuState(false)

    menuToggle?.addEventListener('click', () => {
      const nextIsOpen = !adminShell?.classList.contains('is-mobile-nav-open')
      syncMenuState(Boolean(nextIsOpen))
    })

    dismissTargets.forEach((target) => {
      target.addEventListener('click', () => {
        syncMenuState(false)
      })
    })
  }

  const bindUi = () => {
    const homeBrandButton = appRoot.querySelector<HTMLButtonElement>('#header-home-brand')

    homeBrandButton?.addEventListener('click', () => {
      openHomeHero()
    })

    if (currentPage === 'admin' && session && isAdminUser()) {
      bindAdminShellUi()
      bindAdminUi()
      return
    }

    if (currentPage === 'admin' && session && !isAdminUser()) {
      bindStorefrontShellUi()
      bindProfileUi()
      return
    }

    if (currentPage === 'profile' && session) {
      bindStorefrontShellUi()
      bindProfileUi()
      return
    }

    if (currentPage === 'cart' && session) {
      bindStorefrontShellUi()
      bindCartUi()
      return
    }

    if (currentPage === 'checkout' && session) {
      bindStorefrontShellUi()
      bindCheckoutUi()
      return
    }

    if (currentPage === 'wishlist' && session) {
      bindStorefrontShellUi()
      bindWishlistUi()
      return
    }

    if (
      currentPage === 'auth' ||
      (!session &&
        (
          currentPage === 'profile' ||
          currentPage === 'cart' ||
          currentPage === 'checkout' ||
          currentPage === 'wishlist'
        ))
    ) {
      bindStorefrontShellUi()
      bindAuthUi()
      return
    }

    if (currentPage === 'shop') {
      bindStorefrontShellUi()
      bindShopUi()
      return
    }

    if (currentPage === 'product') {
      bindStorefrontShellUi()
      bindProductUi()
      return
    }

    if (currentPage === 'home' && shouldScrollToHomeHero) {
      requestAnimationFrame(() => {
        appRoot.querySelector<HTMLElement>('#home-hero-section')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      })
      shouldScrollToHomeHero = false
    }

    bindStorefrontShellUi()
    bindHomeUi()
  }

  syncCatalogWishlistFlags()
  syncPageFromHash()
  render()

  window.addEventListener('hashchange', () => {
    syncPageFromHash()
    render()
  })

  if (!isSupabaseConfigured) {
    return
  }

  await loadProductsFromDatabase()

  const {
    data: { session: initialSession },
    error,
  } = await getCurrentSession()

  if (error) {
    setAuthNotice({ tone: 'error', message: error.message })
    return
  }

  if (initialSession) {
    await openProfileForSession(initialSession, { showProfile: getPageFromHash() === 'profile' })
  }

  subscribeToAuthChanges((nextSession) => {
    if (!nextSession) {
      if (session) {
        handleSignedOutState({ tone: 'info', message: 'You have been signed out.' })
      }
      return
    }

    void openProfileForSession(nextSession, { showProfile: getPageFromHash() === 'profile' })
  })
}
