'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type AddCommentResult = { ok: true; commentId: string } | { ok: false; error: string }

/**
 * 親・先生が紐づいた生徒の記録にコメントする。
 *
 * RLS（comments_insert_linked_adult）:
 *   - author_id = auth.uid()
 *   - author_role ∈ {'parent', 'teacher'}
 *   - 該当 record の生徒に紐づいている（is_linked_adult）
 */
export async function addCommentAction(input: {
  recordId: string
  studentId: string
  content: string
}): Promise<AddCommentResult> {
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

  // 自分のロール確認
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || (profile.role !== 'parent' && profile.role !== 'teacher')) {
    return { ok: false, error: 'コメントできるのは親・先生だけです' }
  }

  // 念のため紐づけ確認（RLS でも弾かれるが、わかりやすいエラーを返すため）
  const { data: rel } = await supabase
    .from('relationships')
    .select('id')
    .eq('adult_id', user.id)
    .eq('student_id', input.studentId)
    .maybeSingle()

  if (!rel) {
    return { ok: false, error: 'この生徒と紐づいていません' }
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      record_id: input.recordId,
      author_id: user.id,
      author_role: profile.role,
      content
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/family/${input.studentId}`)
  return { ok: true, commentId: data.id }
}

export type DeleteCommentResult = { ok: true } | { ok: false; error: string }

export async function deleteCommentAction(input: {
  commentId: string
  studentId: string
}): Promise<DeleteCommentResult> {
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

  revalidatePath(`/family/${input.studentId}`)
  return { ok: true }
}
