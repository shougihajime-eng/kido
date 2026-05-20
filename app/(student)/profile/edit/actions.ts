'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isValidLevelKind, type LevelKind } from '@/lib/level'
import { validateDisplayName } from '@/lib/auth/pin'

export type UpdateProfileResult = { ok: true } | { ok: false; error: string }

/**
 * 自分のプロフィール（なまえ・段級）を更新する。
 * RLS により他人の行は触れないので、id 指定は不要。
 */
export async function updateProfileAction(input: {
  displayName: string
  levelKind: LevelKind | null
  levelText: string
  privateMode: boolean
}): Promise<UpdateProfileResult> {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'ログインしてください' }

  const nameCheck = validateDisplayName(input.displayName)
  if (!nameCheck.ok) return nameCheck

  // 現在のプロフィールを取得（role 確認用）
  const { data: current } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const role = (current?.role ?? 'student') as 'student' | 'parent' | 'teacher'

  let safeLevelKind: LevelKind | null = null
  let safeLevelText: string | null = null

  if (role === 'student') {
    if (!input.levelKind || !isValidLevelKind(input.levelKind)) {
      return { ok: false, error: '段級のカテゴリを選んでください' }
    }
    safeLevelKind = input.levelKind
    if (safeLevelKind !== 'none') {
      const trimmed = (input.levelText ?? '').trim()
      if (trimmed.length === 0) {
        return { ok: false, error: '段級を入れてください' }
      }
      if (trimmed.length > 20) {
        return { ok: false, error: '段級は20文字以内で入れてください' }
      }
      safeLevelText = trimmed
    }
  }

  // 名前重複チェック（自分以外）
  const { data: dup } = await supabase
    .from('profiles')
    .select('id')
    .eq('display_name', nameCheck.name)
    .neq('id', user.id)
    .maybeSingle()
  if (dup) {
    return { ok: false, error: 'そのなまえは既に使われています。違うなまえにしてください' }
  }

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({
      display_name: nameCheck.name,
      level_kind: safeLevelKind,
      level_text: safeLevelText,
      private_mode: role === 'student' ? Boolean(input.privateMode) : false
    })
    .eq('id', user.id)

  if (updateErr) {
    return { ok: false, error: updateErr.message }
  }

  revalidatePath('/profile')
  revalidatePath('/follow')
  revalidatePath('/dashboard')
  return { ok: true }
}
