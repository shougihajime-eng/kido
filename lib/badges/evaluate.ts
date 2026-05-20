import 'server-only'
import { todayLocalISO, ymdAddDays } from '@/lib/dates'

// 引数の型は schema 指定がバラバラの SupabaseClient を許容したいので緩める
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any

export type BadgeCriteria =
  // 既存（達成型）
  | { type: 'streak'; value: number }
  | { type: 'total_minutes'; value: number }
  | { type: 'category_minutes'; category: string; value: number }
  | { type: 'week_complete' }
  // 追加：優しい初心者向け
  | { type: 'first_record' }
  | { type: 'welcome' }
  | { type: 'first_self_memo' }
  | { type: 'comeback_after_days'; value: number }
  | { type: 'monthly_active'; days: number; window_days: number }
  | { type: 'time_of_day'; start_hour: number; end_hour: number }
  | { type: 'has_relationship' }
  | { type: 'week_over_week' }

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
  recorded_at: string | null
  self_memo: string | null
  category: { key: string | null; kind: string | null } | null
}

/**
 * 与えられたユーザーが現時点で資格を満たしているバッジ ID 一覧を返す。
 * 過去の獲得済みかどうかは見ない（呼び出し側で差分を取る）。
 *
 * バッジは将棋カテゴリの記録だけで判定する（生活カテゴリを記録しても進捗しない）。
 */
export async function evaluateBadgesForUser(
  supabase: AnyClient,
  userId: string,
): Promise<string[]> {
  // バッジ定義
  const { data: badgesData } = await supabase.from('badges').select('*')
  const badges = (badgesData ?? []) as BadgeDef[]
  if (badges.length === 0) return []

  // 全期間のレコード（kind も取得）
  const { data: rows } = await supabase
    .from('training_records')
    .select('date, duration_minutes, recorded_at, self_memo, category:categories(key, kind)')
    .eq('user_id', userId)

  const allRecords = (rows ?? []) as unknown as RecordRow[]
  // 将棋バッジ判定用：将棋カテゴリのみに絞る
  const records = allRecords.filter((r) => r.category?.kind === 'shogi')

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

  // ── 優しいバッジ用の集計 ──────────────────────────────────────────
  // 「はじめの一歩」用：将棋でも生活でも、何でもいいから1件記録があるか
  const hasAnyRecord = allRecords.length > 0

  // 「気持ちを書いた」：self_memo が1件以上あるか（将棋・生活問わず）
  const hasSelfMemo = allRecords.some(
    (r) => typeof r.self_memo === 'string' && r.self_memo.trim().length > 0
  )

  // 「おかえり／また会えたね」：日付ソートして連続日付の最大ギャップを取る
  // 将棋カテゴリだけだと「生活だけ続けてた」人が漏れるので、全レコードの日付で見る
  const allDateSet = new Set(allRecords.map((r) => r.date))
  const allSortedDates = Array.from(allDateSet).sort()
  let maxGapDays = 0
  for (let i = 1; i < allSortedDates.length; i++) {
    const a = new Date(allSortedDates[i - 1] + 'T00:00:00Z').getTime()
    const b = new Date(allSortedDates[i] + 'T00:00:00Z').getTime()
    const gap = Math.round((b - a) / 86400000)
    if (gap > maxGapDays) maxGapDays = gap
  }

  // 「マイペース」：直近30日間で何日記録したか
  const today = todayLocalISO()
  const monthlyWindowStart = ymdAddDays(today, -29)
  const recentActiveDays = new Set(
    allRecords.filter((r) => r.date >= monthlyWindowStart && r.date <= today).map((r) => r.date)
  ).size

  // 「朝の人／夜の人」：JST 換算で記録された時刻
  const hourSet = new Set<number>()
  for (const r of allRecords) {
    if (!r.recorded_at) continue
    const dt = new Date(r.recorded_at)
    if (Number.isNaN(dt.getTime())) continue
    const jstHour = (dt.getUTCHours() + 9) % 24
    hourSet.add(jstHour)
  }

  // 「ありがとう」：親・先生と紐づいているか
  const { count: relCount } = await supabase
    .from('relationships')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', userId)
  const hasRelationship = (relCount ?? 0) > 0

  // 「自分新記録」：先週合計 < 今週合計 か
  const weekStart = ymdAddDays(today, -6)
  const prevWeekStart = ymdAddDays(today, -13)
  const prevWeekEnd = ymdAddDays(today, -7)
  const thisWeekMin = allRecords
    .filter((r) => r.date >= weekStart && r.date <= today)
    .reduce((s, r) => s + r.duration_minutes, 0)
  const prevWeekMin = allRecords
    .filter((r) => r.date >= prevWeekStart && r.date <= prevWeekEnd)
    .reduce((s, r) => s + r.duration_minutes, 0)
  // 先週ゼロから今週いきなり大量だと「自分新記録」を取れないと寂しいので、
  // prevWeek=0 でも thisWeek>=1 で達成にする
  const personalBestWeek =
    (prevWeekMin === 0 && thisWeekMin > 0) || (prevWeekMin > 0 && thisWeekMin > prevWeekMin)

  // ── 資格判定 ─────────────────────────────────────────────────────
  const earned: string[] = []
  for (const b of badges) {
    const c = b.criteria_json
    let ok = false
    if (c.type === 'streak') ok = longestStreak >= c.value
    else if (c.type === 'total_minutes') ok = totalMinutes >= c.value
    else if (c.type === 'category_minutes')
      ok = (minutesByCategoryKey[c.category] ?? 0) >= c.value
    else if (c.type === 'week_complete') ok = hasFullWeek
    else if (c.type === 'first_record') ok = hasAnyRecord
    // welcome はサインアップ済みなら全員 OK（このコードが動いている＝ログイン済み）
    else if (c.type === 'welcome') ok = true
    else if (c.type === 'first_self_memo') ok = hasSelfMemo
    else if (c.type === 'comeback_after_days') ok = maxGapDays >= c.value
    else if (c.type === 'monthly_active') ok = recentActiveDays >= c.days
    else if (c.type === 'time_of_day') {
      // start_hour <= 時刻 < end_hour
      for (const h of hourSet) {
        if (h >= c.start_hour && h < c.end_hour) {
          ok = true
          break
        }
      }
    }
    else if (c.type === 'has_relationship') ok = hasRelationship
    else if (c.type === 'week_over_week') ok = personalBestWeek
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
