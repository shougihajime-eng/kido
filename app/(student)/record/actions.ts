'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { awardBadgesForUser } from '@/lib/badges/award'

export type SaveRecordResult =
  | { ok: true; recordId: string; newBadges: string[] }
  | { ok: false; error: string }

export type GameResultInput = {
  result: 'win' | 'loss' | 'draw' | 'jisho'
  openingTag?: string
  opponentName?: string
  timeControlMinutes?: number
}

export async function saveRecordAction(input: {
  categoryId: string
  durationMinutes: number
  date: string
  memo?: string
  gameResult?: GameResultInput
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

  // 対局結果が付いていれば紐づけて保存（実戦カテゴリのみの想定）
  if (input.gameResult) {
    const g = input.gameResult
    if (!['win', 'loss', 'draw', 'jisho'].includes(g.result)) {
      return { ok: false, error: '対局結果の形式が不正です' }
    }
    const { error: gErr } = await supabase.from('game_results').insert({
      training_record_id: data.id,
      user_id: user.id,
      result: g.result,
      opening_tag: g.openingTag?.trim() || null,
      opponent_name: g.opponentName?.trim() || null,
      time_control_minutes:
        g.timeControlMinutes && g.timeControlMinutes > 0
          ? Math.floor(g.timeControlMinutes)
          : null
    })
    if (gErr) {
      // training_record は残ってしまうが、ユーザーには通知
      return { ok: false, error: `対局結果の保存に失敗しました: ${gErr.message}` }
    }
  }

  // バッジ評価：記録保存後、新規獲得バッジがあれば返す
  const newBadges = await awardBadgesForUser(user.id)

  revalidatePath('/dashboard')
  revalidatePath('/record')
  revalidatePath('/games')
  revalidatePath('/profile')
  return { ok: true, recordId: data.id, newBadges }
}
