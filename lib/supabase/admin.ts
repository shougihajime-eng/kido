import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * Service Role キーを使うサーバー専用クライアント。
 * RLS をバイパスする。Cron や招待コード処理など、信頼できるサーバー処理のみで使う。
 * 絶対にブラウザに露出させないこと。
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  return createSupabaseClient<Database, 'kido'>(url, serviceRoleKey, {
    db: { schema: 'kido' },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
