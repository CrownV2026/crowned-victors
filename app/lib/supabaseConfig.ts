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

function getFirstDefinedEnv(...values: Array<string | undefined | null>) {
  for (const candidate of values) {
    const value = normalizeEnvValue(candidate)
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
  const supabaseUrl = getFirstDefinedEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_URL)
  const supabaseAnonKey = getFirstDefinedEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, process.env.SUPABASE_ANON_KEY)

  if (!isValidHttpUrl(supabaseUrl) || !supabaseAnonKey) {
    return null
  }

  return { supabaseUrl, supabaseAnonKey }
}

export function getSupabaseServiceConfig(): SupabaseServiceConfig | null {
  const supabaseUrl = getFirstDefinedEnv(process.env.SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_URL)
  const supabaseServiceRoleKey = normalizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY)

  if (!isValidHttpUrl(supabaseUrl) || !supabaseServiceRoleKey) {
    return null
  }

  return { supabaseUrl, supabaseServiceRoleKey }
}