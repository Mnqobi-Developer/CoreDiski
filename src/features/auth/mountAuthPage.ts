import { isSupabaseConfigured } from '../../lib/supabase.ts'
import { getEmailRedirectTo } from '../../config/site.ts'
import { createInitialAuthState } from './authState.ts'
import {
  getCurrentSession,
  signInWithEmail,
  signOutCurrentUser,
  signUpWithEmail,
  subscribeToAuthChanges,
} from './authService.ts'
import { renderAuthPage } from './authTemplates.ts'
import type { AuthMode, Notice } from './authTypes.ts'

export const mountAuthPage = async (appRoot: HTMLDivElement) => {
  const state = createInitialAuthState()

  const render = () => {
    appRoot.innerHTML = renderAuthPage(state)
    bindUi()
  }

  const setNotice = (notice: Notice | null) => {
    state.notice = notice
    render()
  }

  const handleModeSwitch = (mode: AuthMode) => {
    state.mode = mode
    state.notice = null
    state.password = ''
    state.showPassword = false
    render()
  }

  const handleSignUp = async () => {
    const fullName = state.fullName.trim()
    const email = state.email.trim().toLowerCase()
    const password = state.password

    if (!fullName) {
      setNotice({ tone: 'error', message: 'Enter your full name to create an account.' })
      return
    }

    if (!email) {
      setNotice({ tone: 'error', message: 'Enter your email address.' })
      return
    }

    if (password.length < 6) {
      setNotice({ tone: 'error', message: 'Use a password with at least 6 characters.' })
      return
    }

    state.isSubmitting = true
    render()

    const { data, error } = await signUpWithEmail({
      email,
      emailRedirectTo: getEmailRedirectTo(),
      fullName,
      password,
    })

    state.isSubmitting = false

    if (error) {
      setNotice({ tone: 'error', message: error.message })
      return
    }

    state.email = email
    state.fullName = fullName
    state.password = ''

    if (data.session) {
      state.session = data.session
      setNotice({ tone: 'success', message: 'Account created and signed in successfully.' })
      return
    }

    state.mode = 'sign-in'
    state.showPassword = false
    setNotice({
      tone: 'success',
      message: 'Account created. Check your inbox and verify your email before signing in.',
    })
  }

  const handleSignIn = async () => {
    const email = state.email.trim().toLowerCase()
    const password = state.password

    if (!email) {
      setNotice({ tone: 'error', message: 'Enter your email address.' })
      return
    }

    if (!password) {
      setNotice({ tone: 'error', message: 'Enter your password.' })
      return
    }

    state.isSubmitting = true
    render()

    const { data, error } = await signInWithEmail({
      email,
      password,
    })

    state.isSubmitting = false

    if (error) {
      setNotice({ tone: 'error', message: error.message })
      return
    }

    state.password = ''
    state.session = data.session
    setNotice({ tone: 'success', message: 'Signed in successfully.' })
  }

  const handleSignOut = async () => {
    state.isSubmitting = true
    render()

    const { error } = await signOutCurrentUser()

    state.isSubmitting = false

    if (error) {
      setNotice({ tone: 'error', message: error.message })
      return
    }

    state.mode = 'sign-in'
    state.notice = { tone: 'info', message: 'You have been signed out.' }
    state.password = ''
    state.session = null
    state.showPassword = false
    render()
  }

  const bindUi = () => {
    const headerAuthAction = appRoot.querySelector<HTMLButtonElement>('#header-auth-action')
    const switchModeButton = appRoot.querySelector<HTMLButtonElement>('#switch-mode')
    const secondarySignOutButton = appRoot.querySelector<HTMLButtonElement>('#sign-out-secondary')
    const authForm = appRoot.querySelector<HTMLFormElement>('#auth-form')
    const fullNameInput = appRoot.querySelector<HTMLInputElement>('#full-name')
    const emailInput = appRoot.querySelector<HTMLInputElement>('#email')
    const passwordInput = appRoot.querySelector<HTMLInputElement>('#password')
    const togglePasswordButton = appRoot.querySelector<HTMLButtonElement>('#toggle-password')
    const signOutButton = appRoot.querySelector<HTMLButtonElement>('#sign-out')

    headerAuthAction?.addEventListener('click', () => {
      if (state.session) {
        void handleSignOut()
        return
      }

      handleModeSwitch('sign-in')
    })

    switchModeButton?.addEventListener('click', () => {
      handleModeSwitch(state.mode === 'sign-in' ? 'sign-up' : 'sign-in')
    })

    secondarySignOutButton?.addEventListener('click', () => {
      void handleSignOut()
    })

    fullNameInput?.addEventListener('input', (event) => {
      const target = event.currentTarget as HTMLInputElement | null

      state.fullName = target?.value ?? ''
    })

    emailInput?.addEventListener('input', (event) => {
      const target = event.currentTarget as HTMLInputElement | null

      state.email = target?.value ?? ''
    })

    passwordInput?.addEventListener('input', (event) => {
      const target = event.currentTarget as HTMLInputElement | null

      state.password = target?.value ?? ''
    })

    togglePasswordButton?.addEventListener('click', () => {
      state.showPassword = !state.showPassword
      render()
    })

    signOutButton?.addEventListener('click', () => {
      void handleSignOut()
    })

    authForm?.addEventListener('submit', (event) => {
      event.preventDefault()

      if (!isSupabaseConfigured) {
        setNotice({
          tone: 'error',
          message: 'Supabase is not configured correctly. Check your .env file and restart the app.',
        })
        return
      }

      if (state.mode === 'sign-up') {
        void handleSignUp()
        return
      }

      void handleSignIn()
    })
  }

  render()

  if (!isSupabaseConfigured) {
    return
  }

  const {
    data: { session },
    error,
  } = await getCurrentSession()

  if (error) {
    setNotice({ tone: 'error', message: error.message })
    return
  }

  state.session = session
  render()

  subscribeToAuthChanges((nextSession) => {
    state.session = nextSession

    if (!nextSession) {
      render()
      return
    }

    state.notice = {
      tone: 'success',
      message: 'Authentication successful.',
    }
    render()
  })
}
