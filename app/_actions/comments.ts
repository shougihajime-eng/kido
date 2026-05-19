'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { REACTION_EMOJIS } from '@/lib/comments'

export type ActionResult<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string }

/**
 * コメントを書く。
 *
 * RLS (comments_insert_related):
 *   - 生徒: 自分の記録 にコメント可
 *   - 親・先生: 紐づいた生徒の記録 にコメント可
 *   - スーパー先生: 全員可
 *
 * author_role は本人のロールから決定する（クライアントは指定しない）。
 */
export async function addCommentAction(input: {
  recordId: string
  content: string
}): Promise<ActionResult<{ commentId: string }>> {
  const content = input.content.trim()
  if (!content) return { ok: false, error: 'コメントを入力してください' }
  if (content.length > 2000) {
    return { ok: false, error: 'コメントは2000文字以内で入力してください' }
  }

  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'ログインが必要です' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) return { ok: false, error: 'プロフィールが見つかりません' }
  const role = profile.role
  if (role !== 'student' && role !== 'parent' && role !== 'teacher') {
    return { ok: false, error: 'コメントできないロールです' }
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      record_id: input.recordId,
      author_id: user.id,
      author_role: role,
      content
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/family/[studentId]', 'page')

  return { ok: true, data: { commentId: data.id } }
}

/**
 * 自分のコメントを編集する。content のみ更新可。
 * UPDATE ポリシー: author_id = auth.uid()
 */
export async function updateCommentAction(input: {
  commentId: string
  content: string
}): Promise<ActionResult> {
  const content = input.content.trim()
  if (!content) return { ok: false, error: 'コメントを入力してください' }
  if (content.length > 2000) {
    return { ok: false, error: 'コメントは2000文字以内で入力してください' }
  }

  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'ログインが必要です' }

  const { error } = await supabase
    .from('comments')
    .update({ content })
    .eq('id', input.commentId)
    .eq('author_id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/family/[studentId]', 'page')
  return { ok: true }
}

export async function deleteCommentAction(input: {
  commentId: string
}): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'ログインが必要です' }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', input.commentId)
    .eq('author_id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/family/[studentId]', 'page')
  return { ok: true }
}

/**
 * 絵文字リアクションをトグル。
 *   - 既に同じ (comment, user, emoji) がある → 削除
 *   - なければ → INSERT
 */
export async function toggleReactionAction(input: {
  commentId: string
  emoji: string
}): Promise<ActionResult<{ added: boolean }>> {
  const emoji = input.emoji
  if (!(REACTION_EMOJIS as readonly string[]).includes(emoji)) {
    return { ok: false, error: '使えない絵文字です' }
  }

  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'ログインが必要です' }

  // 既存チェック
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await ((supabase as any)
    .from('comment_reactions')
    .select('id')
    .eq('comment_id', input.commentId)
    .eq('user_id', user.id)
    .eq('emoji', emoji)
    .maybeSingle())

  if (existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await ((supabase as any)
      .from('comment_reactions')
      .delete()
      .eq('id', existing.id))
    if (error) return { ok: false, error: error.message }
    revalidatePath('/dashboard')
    revalidatePath('/family/[studentId]', 'page')
    return { ok: true, data: { added: false } }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await ((supabase as any).from('comment_reactions').insert({
      comment_id: input.commentId,
      user_id: user.id,
      emoji
    }))
    if (error) return { ok: false, error: error.message }
    revalidatePath('/dashboard')
    revalidatePath('/family/[studentId]', 'page')
    return { ok: true, data: { added: true } }
  }
}

/**
 * 記録ごとの「自己メモ」を保存する。記録の所有者のみ書き換え可（RLS で保証）。
 */
export async function saveSelfMemoAction(input: {
  recordId: string
  selfMemo: string
}): Promise<ActionResult> {
  const text = input.selfMemo.trim()
  if (text.length > 4000) {
    return { ok: false, error: '自己メモは4000文字以内で入力してください' }
  }

  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'ログインが必要です' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await ((supabase as any)
    .from('training_records')
    .update({ self_memo: text === '' ? null : text })
    .eq('id', input.recordId)
    .eq('user_id', user.id))

  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard')
  revalidatePath('/diary')
  return { ok: true }
}
