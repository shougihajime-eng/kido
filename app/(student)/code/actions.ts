'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateInviteCode } from '@/lib/invite-code'

export type CreateCodeResult =
  | { ok: true; code: string }
  | { ok: false; error: string }

/**
 * 生徒が招待コードを発行する。
 * RLS: invite_codes_insert_self_student により、student_id = auth.uid() かつロールが student の人のみ insert 可能。
 */
export async function createInviteCodeAction(input: {
  kind: 'parent' | 'teacher'
  expiresInDays?: number
}): Promise<CreateCodeResult> {
  if (input.kind !== 'parent' && input.kind !== 'teacher') {
    return { ok: false, error: '種別が不正です' }
  }
  const days = Math.max(1, Math.min(30, input.expiresInDays ?? 7))

  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'ログインが必要です' }

  // 衝突する可能性は極めて低いが、5回まで再試行
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateInviteCode()
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

    const { error } = await supabase.from('invite_codes').insert({
      code,
      student_id: user.id,
      kind: input.kind,
      expires_at: expiresAt
    })

    if (!error) {
      revalidatePath('/code')
      return { ok: true, code }
    }

    // 23505 = unique_violation（コード衝突）。それ以外は即時失敗
    if (error.code !== '23505') {
      return { ok: false, error: error.message }
    }
  }

  return { ok: false, error: 'コード生成に失敗しました。もう一度お試しください' }
}

export type DeleteCodeResult = { ok: true } | { ok: false; error: string }

export async function deleteInviteCodeAction(code: string): Promise<DeleteCodeResult> {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'ログインが必要です' }

  const { error } = await supabase
    .from('invite_codes')
    .delete()
    .eq('code', code)
    .eq('student_id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/code')
  return { ok: true }
}

export type RemoveRelationshipResult = { ok: true } | { ok: false; error: string }

/**
 * 紐づけ解除（双方から可能）。RLS: relationships_delete_party。
 */
export async function removeRelationshipAction(
  relationshipId: string
): Promise<RemoveRelationshipResult> {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'ログインが必要です' }

  const { error } = await supabase.from('relationships').delete().eq('id', relationshipId)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/code')
  revalidatePath('/family')
  return { ok: true }
}
