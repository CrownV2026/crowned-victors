import { createClient } from '@supabase/supabase-js'
import { getSupabaseServiceConfig } from './supabaseConfig'

const config = getSupabaseServiceConfig()

const supabaseAdmin = config
  ? createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: { persistSession: false },
    })
  : null

export { supabaseAdmin }
