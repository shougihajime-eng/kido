'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  isValidPin,
  makeSyntheticEmail,
  pinToPassword,
  validateDisplayName
} from '@/lib/auth/pin'
import { isValidLevelKind, type LevelKind } from '@/lib/level'

export type SignupResult = { ok: true; role: 'student' | 'parent' | 'teacher' } | { ok: false; error: string }

/**
 * 名前 + ロール + 4桁合言葉で新規アカウントを作る。
 *
 * 中の仕組み:
 *   1. 内部メアド（uuid@kido.local）を生成
 *   2. admin.createUser で email_confirm: true な auth.users 行を作成
 *      → 既存のトリガー kido.handle_new_user が profiles を作る
 *   3. signInWithPassword で Cookie をセット（=ログイン完了）
 */
export async function signupWithPinAction(input: {
  displayName: string
  role: 'student' | 'parent' | 'teacher'
  pin: string
  levelKind?: LevelKind | null
  levelText?: string
}): Promise<SignupResult> {
  const role = input.role
  if (role !== 'student' && role !== 'parent' && role !== 'teacher') {
    return { ok: false, error: 'やくわりを選んでください' }
  }

  const nameCheck = validateDisplayName(input.displayName)
  if (!nameCheck.ok) return nameCheck

  if (!isValidPin(input.pin)) {
    return { ok: false, error: '合言葉は半角数字 4桁で入れてください' }
  }

  // 生徒だけ段級が必須
  let safeLevelKind: LevelKind | null = null
  let safeLevelText = ''
  if (role === 'student') {
    if (!input.levelKind || !isValidLevelKind(input.levelKind)) {
      return { ok: false, error: '段級のカテゴリを選んでください' }
    }
    safeLevelKind = input.levelKind
    if (safeLevelKind !== 'none') {
      const trimmed = (input.levelText ?? '').trim()
      if (trimmed.length === 0) {
        return { ok: false, error: '段級（例：三段、2級、B1 など）を入れてください' }
      }
      if (trimmed.length > 20) {
        return { ok: false, error: '段級は20文字以内で入れてください' }
      }
      safeLevelText = trimmed
    }
  }

  const admin = createAdminClient()

  // 名前の重複チェック
  const { data: existing, error: lookupErr } = await admin
    .from('profiles')
    .select('id')
    .eq('display_name', nameCheck.name)
    .maybeSingle()

  if (lookupErr) {
    return { ok: false, error: lookupErr.message }
  }
  if (existing) {
    return { ok: false, error: 'そのなまえは既に使われています。違うなまえを試してください' }
  }

  const syntheticEmail = makeSyntheticEmail()
  const password = pinToPassword(input.pin)

  // admin で確定済みユーザーを作る（メール認証スキップ）
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: syntheticEmail,
    password,
    email_confirm: true,
    user_metadata: {
      app: 'kido',
      role,
      display_name: nameCheck.name,
      synthetic_email: syntheticEmail,
      level_kind: safeLevelKind,
      level_text: safeLevelText
    }
  })

  if (createErr || !created?.user) {
    return { ok: false, error: createErr?.message ?? '作成に失敗しました' }
  }

  // トリガーが入れているはずだが、未対応の DB だったとき用に念のため上書き
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin
    .from('profiles')
    .update({
      synthetic_email: syntheticEmail,
      display_name: nameCheck.name,
      role,
      level_kind: safeLevelKind,
      level_text: safeLevelText || null
    } as any)
    .eq('id', created.user.id))

  // Cookie をセットしてログイン完了状態に
  const supabase = await createClient()
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: syntheticEmail,
    password
  })

  if (signInErr) {
    return { ok: false, error: signInErr.message }
  }

  return { ok: true, role }
}

/** クライアントから「サインアップしてそのまま遷移」したいときに使うヘルパー */
export async function signupAndRedirectAction(input: {
  displayName: string
  role: 'student' | 'parent' | 'teacher'
  pin: string
}): Promise<{ ok: false; error: string } | never> {
  const result = await signupWithPinAction(input)
  if (!result.ok) return result
  redirect(result.role === 'student' ? '/dashboard' : '/family')
}
