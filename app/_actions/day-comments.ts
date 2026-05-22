'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ActionResult<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string }

/**
 * 日コメントを書く（記録の有無に関わらず student × date の組で残せる）。
 * RLS:
 *   - 生徒: 自分の日にだけ書ける
 *   - 親・先生: 紐づき生徒の日に書ける
 *   - スーパー先生: どの生徒の日にも書ける
 */
export async function addDayCommentAction(input: {
  studentId: string
  date: string // YYYY-MM-DD
  content: string
}): Promise<ActionResult<{ commentId: string }>> {
  const content = input.content.trim()
  if (!content) return { ok: false, error: 'コメントを入力してください' }
  if (content.length > 2000) {
    return { ok: false, error: 'コメントは2000文字以内で入力してください' }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    return { ok: false, error: '日付の形式がおかしいです' }
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await ((supabase as any)
    .from('day_comments')
    .insert({
      student_id: input.studentId,
      date: input.date,
      author_id: user.id,
      author_role: role,
      content
    })
    .select('id')
    .single())

  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/calendar')
  revalidatePath('/family/[studentId]', 'page')

  return { ok: true, data: { commentId: data.id } }
}

/**
 * 自分が書いた日コメントの content を更新する。
 */
export async function updateDayCommentAction(input: {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await ((supabase as any)
    .from('day_comments')
    .update({ content })
    .eq('id', input.commentId)
    .eq('author_id', user.id))

  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/calendar')
  revalidatePath('/family/[studentId]', 'page')
  return { ok: true }
}

export async function deleteDayCommentAction(input: {
  commentId: string
}): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'ログインが必要です' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await ((supabase as any)
    .from('day_comments')
    .delete()
    .eq('id', input.commentId)
    .eq('author_id', user.id))

  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/calendar')
  revalidatePath('/family/[studentId]', 'page')
  return { ok: true }
}
