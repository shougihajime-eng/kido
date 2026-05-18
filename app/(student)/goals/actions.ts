'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  endOfMonthISO,
  endOfWeekISO,
  startOfMonthISO,
  startOfWeekISO,
  todayLocalISO
} from '@/lib/dates'

export type CreateGoalResult = { ok: true; goalId: string } | { ok: false; error: string }

export async function createGoalAction(input: {
  period: 'weekly' | 'monthly'
  categoryId?: string | null
  targetMinutes: number
}): Promise<CreateGoalResult> {
  if (input.period !== 'weekly' && input.period !== 'monthly') {
    return { ok: false, error: '期間が不正です' }
  }
  if (!Number.isFinite(input.targetMinutes) || input.targetMinutes <= 0) {
    return { ok: false, error: '目標時間は1分以上で入力してください' }
  }
  // 上限：週は 168h、月は 720h
  const maxMinutes = input.period === 'weekly' ? 168 * 60 : 720 * 60
  if (input.targetMinutes > maxMinutes) {
    return { ok: false, error: '目標時間が大きすぎます' }
  }

  const today = todayLocalISO()
  const startDate = input.period === 'weekly' ? startOfWeekISO(today) : startOfMonthISO(today)
  const endDate = input.period === 'weekly' ? endOfWeekISO(today) : endOfMonthISO(today)

  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'ログインが必要です' }

  // 同じ期間・同じカテゴリ範囲の目標が既にあるなら却下（重複防止）
  let dupQuery = supabase
    .from('goals')
    .select('id')
    .eq('user_id', user.id)
    .eq('period', input.period)
    .eq('start_date', startDate)
    .eq('end_date', endDate)
  dupQuery = input.categoryId
    ? dupQuery.eq('category_id', input.categoryId)
    : dupQuery.is('category_id', null)
  const { data: existing } = await dupQuery.maybeSingle()

  if (existing) {
    return { ok: false, error: 'この期間の同じ目標は既に設定されています' }
  }

  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: user.id,
      period: input.period,
      category_id: input.categoryId ?? null,
      target_minutes: Math.floor(input.targetMinutes),
      start_date: startDate,
      end_date: endDate
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  revalidatePath('/goals')
  revalidatePath('/dashboard')
  return { ok: true, goalId: data.id }
}

export type DeleteGoalResult = { ok: true } | { ok: false; error: string }

export async function deleteGoalAction(goalId: string): Promise<DeleteGoalResult> {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'ログインが必要です' }

  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/goals')
  revalidatePath('/dashboard')
  return { ok: true }
}

export type UpdateGoalResult = { ok: true } | { ok: false; error: string }

export async function updateGoalTargetAction(input: {
  goalId: string
  targetMinutes: number
}): Promise<UpdateGoalResult> {
  if (!Number.isFinite(input.targetMinutes) || input.targetMinutes <= 0) {
    return { ok: false, error: '目標時間は1分以上で入力してください' }
  }

  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'ログインが必要です' }

  const { error } = await supabase
    .from('goals')
    .update({ target_minutes: Math.floor(input.targetMinutes) })
    .eq('id', input.goalId)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/goals')
  revalidatePath('/dashboard')
  return { ok: true }
}
