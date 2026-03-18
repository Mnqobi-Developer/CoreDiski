import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured } from '../lib/supabase.ts'
import { getEmailRedirectTo } from '../config/site.ts'
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
import { renderHomePage } from '../features/home/homeTemplates.ts'
import { createInitialProfileState } from '../features/profile/profileState.ts'
import { loadOrCreateProfile, saveProfile } from '../features/profile/profileService.ts'
import { renderProfilePage } from '../features/profile/profileTemplates.ts'
import type { ProfileRecord } from '../features/profile/profileTypes.ts'
import type { Notice } from '../shared/types/notice.ts'

export const mountStorefrontApp = async (appRoot: HTMLDivElement) => {
  const authState = createInitialAuthState()
  const profileState = createInitialProfileState()
  let session: Session | null = null
  let currentPage: 'auth' | 'home' | 'profile' = 'home'

  const getPageFromHash = (): 'auth' | 'home' | 'profile' => {
    const route = window.location.hash.replace('#', '').trim().toLowerCase()

    if (route === 'auth' || route === 'signin' || route === 'sign-in') {
      return 'auth'
    }

    if (route === 'profile') {
      return 'profile'
    }

    return 'home'
  }

  const syncPageFromHash = () => {
    currentPage = getPageFromHash()
  }

  const navigateTo = (page: 'auth' | 'home' | 'profile') => {
    const nextHash = `#${page}`

    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash
      return
    }

    syncPageFromHash()
    render()
  }

  const syncProfileForm = (profile: ProfileRecord | null) => {
    profileState.form = {
      address: profile?.address ?? '',
      emailPreferences: profile?.emailPreferences ?? 'General updates',
      fullName: profile?.fullName ?? '',
      phone: profile?.phone ?? '',
    }
  }

  const resetProfileState = () => {
    const freshState = createInitialProfileState()

    profileState.form = freshState.form
    profileState.isEditing = freshState.isEditing
    profileState.isLoading = freshState.isLoading
    profileState.isSaving = freshState.isSaving
    profileState.notice = freshState.notice
    profileState.profile = freshState.profile
  }

  const render = () => {
    if (currentPage === 'profile' && session) {
      appRoot.innerHTML = renderProfilePage({
        profileState,
        session,
      })
    } else if (currentPage === 'auth' || (!session && currentPage === 'profile')) {
      appRoot.innerHTML = renderAuthPage(authState)
    } else {
      appRoot.innerHTML = renderHomePage({
        actionButton: session
          ? {
              id: 'header-profile-action',
              isActive: false,
              label: 'Profile',
            }
          : {
              id: 'header-auth-action',
              isActive: false,
              label: 'Sign In',
            },
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

    profileState.profile = data
    syncProfileForm(data)
    render()
  }

  const openProfileForSession = async (
    nextSession: Session,
    options?: {
      showProfile?: boolean
    },
  ) => {
    session = nextSession

    if (profileState.profile?.id === nextSession.user.id) {
      if (options?.showProfile) {
        currentPage = 'profile'
      }
      render()
      return
    }

    await loadProfile(nextSession)
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
      navigateTo('profile')
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
    navigateTo('profile')
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
    syncProfileForm(data)
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

  const bindProfileUi = () => {
    const headerProfileAction = appRoot.querySelector<HTMLButtonElement>('#header-profile-action')
    const sidebarLogoutButton = appRoot.querySelector<HTMLButtonElement>('#sidebar-logout')
    const editProfileButton = appRoot.querySelector<HTMLButtonElement>('#edit-profile')
    const cancelProfileButton = appRoot.querySelector<HTMLButtonElement>('#cancel-profile')
    const profileForm = appRoot.querySelector<HTMLFormElement>('#profile-form')
    const fullNameInput = appRoot.querySelector<HTMLInputElement>('#profile-full-name')
    const phoneInput = appRoot.querySelector<HTMLInputElement>('#profile-phone')
    const emailPreferencesInput =
      appRoot.querySelector<HTMLInputElement>('#profile-email-preferences')
    const addressInput = appRoot.querySelector<HTMLTextAreaElement>('#profile-address')

    headerProfileAction?.addEventListener('click', () => {
      profileState.notice = null
      navigateTo('profile')
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
    const headerAuthAction = appRoot.querySelector<HTMLButtonElement>('#header-auth-action')
    const headerProfileAction = appRoot.querySelector<HTMLButtonElement>('#header-profile-action')
    const searchForm = appRoot.querySelector<HTMLFormElement>('#home-search-form')
    const searchInput = appRoot.querySelector<HTMLInputElement>('#home-search-input')
    const popularLinks = appRoot.querySelectorAll<HTMLButtonElement>('[data-search]')

    headerAuthAction?.addEventListener('click', () => {
      handleModeSwitch('sign-in')
      navigateTo('auth')
    })

    headerProfileAction?.addEventListener('click', () => {
      navigateTo('profile')
    })

    popularLinks.forEach((button) => {
      button.addEventListener('click', () => {
        const nextValue = button.dataset.search ?? ''

        if (searchInput) {
          searchInput.value = nextValue
          searchInput.focus()
        }
      })
    })

    searchForm?.addEventListener('submit', (event) => {
      event.preventDefault()

      if (!searchInput) {
        return
      }

      searchInput.focus()
      searchInput.select()
    })
  }

  const bindUi = () => {
    if (currentPage === 'profile' && session) {
      bindProfileUi()
      return
    }

    if (currentPage === 'auth' || (!session && currentPage === 'profile')) {
      bindAuthUi()
      return
    }

    bindHomeUi()
  }

  syncPageFromHash()
  render()

  window.addEventListener('hashchange', () => {
    syncPageFromHash()
    render()
  })

  if (!isSupabaseConfigured) {
    return
  }

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
