export type SupabasePublicConfig = {
  supabaseUrl: string
  supabaseAnonKey: string
}

export type SupabaseServiceConfig = {
  supabaseUrl: string
  supabaseServiceRoleKey: string
}

function normalizeEnvValue(value: string | undefined | null) {
  return typeof value === 'string' ? value.trim() : ''
}

export function isValidHttpUrl(value: string) {
  if (!value) return false

  try {
    const parsedUrl = new URL(value)
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
  } catch {
    return false
  }
}

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const supabaseUrl = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const supabaseAnonKey = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (!isValidHttpUrl(supabaseUrl) || !supabaseAnonKey) {
    return null
  }

  return { supabaseUrl, supabaseAnonKey }
}

export function getSupabaseServiceConfig(): SupabaseServiceConfig | null {
  const supabaseUrl = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const supabaseServiceRoleKey = normalizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY)

  if (!isValidHttpUrl(supabaseUrl) || !supabaseServiceRoleKey) {
    return null
  }

  return { supabaseUrl, supabaseServiceRoleKey }
}