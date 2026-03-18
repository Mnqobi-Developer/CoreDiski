import './style.css'
import {
  getSupabaseEnvSummary,
  isSupabaseConfigured,
  supabaseAnonKey,
  supabase,
  supabaseUrl,
} from './lib/supabase.ts'

type ConnectionState = {
  detail: string
  label: string
  tone: 'danger' | 'neutral' | 'success'
}

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('App root element was not found.')
}

app.innerHTML = `
  <main class="shell">
    <section class="hero-card">
      <p class="eyebrow">CoreDiski x Supabase</p>
      <h1>Supabase is wired into this Vite project.</h1>
      <p class="lede">
        The client is initialised once, environment variables are typed, and the app can verify
        whether your project URL is reachable.
      </p>

      <div class="status-grid">
        <article class="status-card ${isSupabaseConfigured ? 'is-ready' : 'is-missing'}">
          <span class="status-label">Environment</span>
          <strong>${isSupabaseConfigured ? 'Configured' : 'Missing values'}</strong>
          <p>${getSupabaseEnvSummary()}</p>
        </article>
        <article id="connection-card" class="status-card is-checking">
          <span class="status-label">Connection</span>
          <strong id="connection-title">Checking...</strong>
          <p id="connection-detail">Attempting to reach your Supabase Auth settings endpoint.</p>
        </article>
      </div>
    </section>

    <section class="panel-grid">
      <article class="panel">
        <h2>Environment variables</h2>
        <p>Create a local <code>.env</code> file and add the values from your Supabase project settings.</p>
        <pre><code>VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key</code></pre>
      </article>

      <article class="panel">
        <h2>Reusable client</h2>
        <p>Import the configured client anywhere in the app:</p>
        <pre><code>import { supabase } from './lib/supabase'

const { data, error } = await supabase.from('your_table').select('*')</code></pre>
      </article>

      <article class="panel">
        <h2>Current project URL</h2>
        <p>${supabaseUrl ?? 'No URL configured yet.'}</p>
      </article>
    </section>
  </main>
`

const connectionCard = document.querySelector<HTMLElement>('#connection-card')
const connectionTitle = document.querySelector<HTMLElement>('#connection-title')
const connectionDetail = document.querySelector<HTMLElement>('#connection-detail')

const renderConnectionState = ({ detail, label, tone }: ConnectionState) => {
  if (!connectionCard || !connectionTitle || !connectionDetail) {
    return
  }

  connectionCard.classList.remove('is-checking', 'is-ready', 'is-missing')
  connectionCard.classList.add(
    tone === 'success' ? 'is-ready' : tone === 'danger' ? 'is-missing' : 'is-checking',
  )
  connectionTitle.textContent = label
  connectionDetail.textContent = detail
}

const checkSupabaseConnection = async () => {
  if (!isSupabaseConfigured) {
    renderConnectionState({
      tone: 'danger',
      label: 'Configuration required',
      detail: 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to continue.',
    })
    return
  }

  try {
    const { error } = await supabase.auth.getSession()

    if (error) {
      throw error
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase environment variables are incomplete.')
    }

    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        apikey: supabaseAnonKey,
      },
    })

    if (!response.ok) {
      throw new Error(`Supabase responded with HTTP ${response.status}.`)
    }

    renderConnectionState({
      tone: 'success',
      label: 'Reachable',
      detail: 'The client loaded and your Supabase project responded successfully.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown connection error.'

    renderConnectionState({
      tone: 'danger',
      label: 'Connection failed',
      detail: message,
    })
  }
}

void checkSupabaseConnection()
