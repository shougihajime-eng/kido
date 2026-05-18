'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isValidInviteCode, normalizeInviteCode } from '@/lib/invite-code'

export type RedeemResult =
  | { ok: true; studentDisplayName: string; kind: 'parent' | 'teacher' }
  | { ok: false; error: string }

/**
 * 親・先生が招待コードを使って生徒と紐づく。
 *
 * RLS では invite_codes の更新も relationships の挿入も親側からはできないので、
 * 検証はサーバ側で行い、書き込みは service_role でバイパスする。
 */
export async function redeemInviteCodeAction(rawCode: string): Promise<RedeemResult> {
  const code = normalizeInviteCode(rawCode)
  if (!isValidInviteCode(code)) {
    return { ok: false, error: '招待コードが正しくありません（英数8文字）' }
  }

  // 認証ユーザー（親・先生）を取得
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'ログインが必要です' }

  // 自分のロールを確認
  const { data: myProfile, error: profileErr } = await supabase
    .from('profiles')
    .select('id, role, display_name')
    .eq('id', user.id)
    .single()

  if (profileErr || !myProfile) {
    return { ok: false, error: 'プロフィールの取得に失敗しました' }
  }
  if (myProfile.role !== 'parent' && myProfile.role !== 'teacher') {
    return { ok: false, error: 'このコードは親・先生アカウントでのみ使えます' }
  }

  // ここから service_role：コード検証 → 使用済みマーク → 紐づけ挿入を一連で
  const admin = createAdminClient()

  // 1) コード取得（バイパス）
  const { data: invite, error: inviteErr } = await admin
    .from('invite_codes')
    .select('code, student_id, kind, expires_at, used_at')
    .eq('code', code)
    .maybeSingle()

  if (inviteErr) return { ok: false, error: inviteErr.message }
  if (!invite) return { ok: false, error: 'このコードは見つかりませんでした' }
  if (invite.used_at) return { ok: false, error: 'このコードは既に使われています' }
  if (new Date(invite.expires_at).getTime() < Date.now()) {
    return { ok: false, error: 'このコードは有効期限が切れています' }
  }

  // kind が自分のロールと合っているかチェック
  if (invite.kind !== myProfile.role) {
    const expected = invite.kind === 'parent' ? '親' : '先生'
    return { ok: false, error: `このコードは「${expected}」用です。役割が合いません` }
  }

  // 2) 生徒の情報を取得（表示用）
  const { data: studentProfile } = await admin
    .from('profiles')
    .select('id, display_name')
    .eq('id', invite.student_id)
    .maybeSingle()

  if (!studentProfile) {
    return { ok: false, error: '生徒のプロフィールが見つかりません' }
  }

  // 3) 既に紐づいていないか確認
  const { data: existing } = await admin
    .from('relationships')
    .select('id')
    .eq('adult_id', user.id)
    .eq('student_id', invite.student_id)
    .maybeSingle()

  if (existing) {
    // コードを消費せずエラーで返す（重複は意図したものではないので）
    return { ok: false, error: '既にこの生徒と紐づいています' }
  }

  // 4) 紐づけ挿入
  const { error: insertErr } = await admin.from('relationships').insert({
    adult_id: user.id,
    student_id: invite.student_id,
    kind: invite.kind,
    confirmed: true
  })

  if (insertErr) {
    return { ok: false, error: `紐づけに失敗しました: ${insertErr.message}` }
  }

  // 5) コードを使用済みに
  const { error: markErr } = await admin
    .from('invite_codes')
    .update({ used_at: new Date().toISOString(), used_by: user.id })
    .eq('code', code)

  if (markErr) {
    // 紐づけ自体は成功しているのでログだけ
    console.error('[redeem] mark used failed:', markErr)
  }

  revalidatePath('/family')
  return {
    ok: true,
    studentDisplayName: studentProfile.display_name,
    kind: invite.kind as 'parent' | 'teacher'
  }
}
