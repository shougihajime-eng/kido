import 'server-only'
import { ymdAddDays } from '@/lib/dates'

// 引数の型は schema 指定がバラバラの SupabaseClient を許容したいので緩める
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any

export type BadgeCriteria =
  | { type: 'streak'; value: number }
  | { type: 'total_minutes'; value: number }
  | { type: 'category_minutes'; category: string; value: number }
  | { type: 'week_complete' }

export type BadgeDef = {
  id: string
  name: string
  description: string
  icon_key: string
  criteria_json: BadgeCriteria
}

type RecordRow = {
  date: string
  duration_minutes: number
  category: { key: string | null } | null
}

/**
 * 与えられたユーザーが現時点で資格を満たしているバッジ ID 一覧を返す。
 * 過去の獲得済みかどうかは見ない（呼び出し側で差分を取る）。
 */
export async function evaluateBadgesForUser(
  supabase: AnyClient,
  userId: string,
): Promise<string[]> {
  // バッジ定義
  const { data: badgesData } = await supabase.from('badges').select('*')
  const badges = (badgesData ?? []) as BadgeDef[]
  if (badges.length === 0) return []

  // 全期間のレコード
  const { data: rows } = await supabase
    .from('training_records')
    .select('date, duration_minutes, category:categories(key)')
    .eq('user_id', userId)

  const records = (rows ?? []) as unknown as RecordRow[]
  if (records.length === 0) return []

  // 集計
  const totalMinutes = records.reduce((s, r) => s + r.duration_minutes, 0)

  const minutesByCategoryKey: Record<string, number> = {}
  for (const r of records) {
    const key = r.category?.key
    if (key) minutesByCategoryKey[key] = (minutesByCategoryKey[key] ?? 0) + r.duration_minutes
  }

  // 日付集合（重複排除）
  const dateSet = new Set(records.map((r) => r.date))
  const sortedDates = Array.from(dateSet).sort()

  // 最長連続日数
  let longestStreak = 0
  let cur = 0
  let prev: string | null = null
  for (const d of sortedDates) {
    if (prev === null) {
      cur = 1
    } else {
      const expected = ymdAddDays(prev, 1)
      cur = d === expected ? cur + 1 : 1
    }
    longestStreak = Math.max(longestStreak, cur)
    prev = d
  }

  // 週7日達成：ISO 週単位で7日揃ったことがあるか
  const byWeek = new Map<string, Set<string>>()
  for (const d of dateSet) {
    const wk = isoWeekKey(d)
    const set = byWeek.get(wk) ?? new Set<string>()
    set.add(d)
    byWeek.set(wk, set)
  }
  const hasFullWeek = Array.from(byWeek.values()).some((s) => s.size >= 7)

  // 資格判定
  const earned: string[] = []
  for (const b of badges) {
    const c = b.criteria_json
    let ok = false
    if (c.type === 'streak') ok = longestStreak >= c.value
    else if (c.type === 'total_minutes') ok = totalMinutes >= c.value
    else if (c.type === 'category_minutes')
      ok = (minutesByCategoryKey[c.category] ?? 0) >= c.value
    else if (c.type === 'week_complete') ok = hasFullWeek
    if (ok) earned.push(b.id)
  }
  return earned
}

/**
 * 日付 (YYYY-MM-DD) から ISO 週キー (YYYY-Www) を返す。
 */
function isoWeekKey(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  // ISO 木曜の年と週番号
  dt.setUTCDate(dt.getUTCDate() + 4 - (dt.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((dt.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${dt.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}
