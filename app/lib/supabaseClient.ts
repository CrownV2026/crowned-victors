import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getSupabasePublicConfig } from './supabaseConfig'

let cachedSupabaseClient: SupabaseClient | null = null

export function isSupabaseConfigured() {
  return !!getSupabasePublicConfig()
}

function getSupabaseClient() {
  if (cachedSupabaseClient) {
    return cachedSupabaseClient
  }

  const config = getSupabasePublicConfig()
  if (!config) {
    return null
  }

  cachedSupabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey)
  return cachedSupabaseClient
}

const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabaseClient()

    if (!client) {
      throw new Error(
        'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL to a valid HTTP/HTTPS URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the deployment environment.'
      )
    }

    const value = Reflect.get(client as unknown as object, prop, receiver)
    return typeof value === 'function' ? value.bind(client) : value
  },
})

export default supabase
