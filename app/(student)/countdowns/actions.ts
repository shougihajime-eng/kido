'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type CountdownResult = { ok: true } | { ok: false; error: string }

export async function addCountdownAction(input: {
  title: string
  targetDate: string // YYYY-MM-DD
  emoji: string
}): Promise<CountdownResult> {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'ログインしてください' }

  const title = (input.title ?? '').trim()
  if (title.length === 0) return { ok: false, error: 'タイトルを入れてください' }
  if (title.length > 40) return { ok: false, error: 'タイトルは40文字以内で入れてください' }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.targetDate)) {
    return { ok: false, error: '日付の形式が正しくありません' }
  }

  const emoji = (input.emoji ?? '📅').trim() || '📅'

  // countdowns テーブルは Database 型未再生成のため untyped でアクセス
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const untyped = supabase as any
  const { error } = await untyped.from('countdowns').insert({
    user_id: user.id,
    title,
    target_date: input.targetDate,
    emoji
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath('/countdowns')
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function deleteCountdownAction(id: string): Promise<CountdownResult> {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'ログインしてください' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const untyped = supabase as any
  const { error } = await untyped
    .from('countdowns')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/countdowns')
  revalidatePath('/dashboard')
  return { ok: true }
}
