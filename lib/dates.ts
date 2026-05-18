/** ローカルタイムの YYYY-MM-DD（タイムゾーンずれ対策） */
export function todayLocalISO(): string {
  return ymdLocal(new Date())
}

export function ymdLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(d: Date, n: number): Date {
  const next = new Date(d)
  next.setDate(next.getDate() + n)
  return next
}

export function ymdAddDays(s: string, n: number): string {
  return ymdLocal(addDays(parseYmd(s), n))
}

/**
 * 連続記録（ストリーク）日数を計算。
 * 「今日」に記録があればそこから連続を数える。
 * 「今日」に無く「昨日」に有る場合は昨日からの連続数を返し、needsToday=true で「今日やればキープ」のサインを出す。
 */
export function computeStreak(distinctDates: string[]): { count: number; needsToday: boolean } {
  if (distinctDates.length === 0) return { count: 0, needsToday: false }
  const set = new Set(distinctDates)
  const today = todayLocalISO()
  const yesterday = ymdAddDays(today, -1)

  let cursor: string
  let needsToday: boolean
  if (set.has(today)) {
    cursor = today
    needsToday = false
  } else if (set.has(yesterday)) {
    cursor = yesterday
    needsToday = true
  } else {
    return { count: 0, needsToday: false }
  }

  let count = 0
  while (set.has(cursor)) {
    count++
    cursor = ymdAddDays(cursor, -1)
  }
  return { count, needsToday }
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}分`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}時間`
  return `${h}時間${m}分`
}
