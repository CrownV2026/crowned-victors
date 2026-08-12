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

function getFirstDefinedEnv(...keys: string[]) {
  for (const key of keys) {
    const value = normalizeEnvValue(process.env[key])
    if (value) return value
  }

  return ''
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
  const supabaseUrl = getFirstDefinedEnv('NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL')
  const supabaseAnonKey = getFirstDefinedEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY')

  if (!isValidHttpUrl(supabaseUrl) || !supabaseAnonKey) {
    return null
  }

  return { supabaseUrl, supabaseAnonKey }
}

export function getSupabaseServiceConfig(): SupabaseServiceConfig | null {
  const supabaseUrl = getFirstDefinedEnv('SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL')
  const supabaseServiceRoleKey = normalizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY)

  if (!isValidHttpUrl(supabaseUrl) || !supabaseServiceRoleKey) {
    return null
  }

  return { supabaseUrl, supabaseServiceRoleKey }
}