'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isValidPin, pinToPassword, validateDisplayName } from '@/lib/auth/pin'

export type LoginResult =
  | { ok: true; role: 'student' | 'parent' | 'teacher' }
  | { ok: false; error: string }

/**
 * 名前 + 4桁合言葉でログイン。
 *
 * 1. service_role で profiles から synthetic_email を引く
 * 2. signInWithPassword（クッキー版クライアント）で本物のログイン
 */
export async function loginWithPinAction(input: {
  displayName: string
  pin: string
}): Promise<LoginResult> {
  const nameCheck = validateDisplayName(input.displayName)
  if (!nameCheck.ok) return nameCheck

  if (!isValidPin(input.pin)) {
    return { ok: false, error: '合言葉は半角数字 4桁で入れてください' }
  }

  const admin = createAdminClient()

  const { data: profile, error: lookupErr } = await admin
    .from('profiles')
    .select('id, synthetic_email, role')
    .eq('display_name', nameCheck.name)
    .maybeSingle()

  if (lookupErr) {
    return { ok: false, error: lookupErr.message }
  }

  if (!profile || !profile.synthetic_email) {
    // 「名前が見つからない」と「PIN が違う」は同じメッセージにしてヒントを与えない
    return { ok: false, error: 'なまえか合言葉が違います' }
  }

  const password = pinToPassword(input.pin)
  const supabase = await createClient()

  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: profile.synthetic_email,
    password
  })

  if (signInErr) {
    return { ok: false, error: 'なまえか合言葉が違います' }
  }

  return { ok: true, role: profile.role as 'student' | 'parent' | 'teacher' }
}
