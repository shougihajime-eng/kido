'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { todayLocalISO } from '@/lib/dates'

export type MoodResult = { ok: true } | { ok: false; error: string }

export async function setMoodAction(input: {
  score: number
  energy?: number
  memo?: string
  date?: string
}): Promise<MoodResult> {
  if (!Number.isFinite(input.score) || input.score < 1 || input.score > 5) {
    return { ok: false, error: '気分は1〜5で記録してください' }
  }
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'ログインが必要です' }

  const date = input.date ?? todayLocalISO()

  // 1日1件：UPSERT
  const { error } = await supabase
    .from('mood_logs')
    .upsert(
      {
        user_id: user.id,
        date,
        score: input.score,
        energy: input.energy ?? null,
        memo: input.memo?.trim() || null
      },
      { onConflict: 'user_id,date' }
    )

  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/mood')
  return { ok: true }
}
