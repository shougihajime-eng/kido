'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ActionResult<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string }

export async function addDiaryEntryAction(input: {
  date: string
  content: string
}): Promise<ActionResult<{ id: string }>> {
  const content = input.content.trim()
  if (!content) return { ok: false, error: '内容を入力してください' }
  if (content.length > 6000) return { ok: false, error: '6000文字以内で書いてください' }

  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'ログインが必要です' }

  const { data, error } = await supabase
    .from('diary_entries')
    .insert({
      user_id: user.id,
      date: input.date,
      content,
      visibility: 'self'
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }
  revalidatePath('/diary')
  return { ok: true, data: { id: data.id } }
}

export async function updateDiaryEntryAction(input: {
  id: string
  content: string
}): Promise<ActionResult> {
  const content = input.content.trim()
  if (!content) return { ok: false, error: '内容を入力してください' }
  if (content.length > 6000) return { ok: false, error: '6000文字以内で書いてください' }

  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'ログインが必要です' }

  const { error } = await supabase
    .from('diary_entries')
    .update({ content })
    .eq('id', input.id)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/diary')
  return { ok: true }
}

export async function deleteDiaryEntryAction(input: {
  id: string
}): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'ログインが必要です' }

  const { error } = await supabase
    .from('diary_entries')
    .delete()
    .eq('id', input.id)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/diary')
  return { ok: true }
}
