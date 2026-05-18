'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type SaveRecordResult =
  | { ok: true; recordId: string }
  | { ok: false; error: string }

export async function saveRecordAction(input: {
  categoryId: string
  durationMinutes: number
  date: string
  memo?: string
}): Promise<SaveRecordResult> {
  if (!input.categoryId) return { ok: false, error: 'カテゴリを選んでください' }
  if (!Number.isFinite(input.durationMinutes) || input.durationMinutes <= 0) {
    return { ok: false, error: '時間を1分以上で入力してください' }
  }
  if (input.durationMinutes > 1440) {
    return { ok: false, error: '時間は1440分（24時間）以内で入力してください' }
  }

  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'ログインが必要です' }

  const { data, error } = await supabase
    .from('training_records')
    .insert({
      user_id: user.id,
      date: input.date,
      category_id: input.categoryId,
      duration_minutes: Math.floor(input.durationMinutes),
      memo: input.memo?.trim() || null
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/record')
  return { ok: true, recordId: data.id }
}
