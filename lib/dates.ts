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

/** 今週（月曜開始）の開始日 YYYY-MM-DD */
export function startOfWeekISO(today: string = todayLocalISO()): string {
  const d = parseYmd(today)
  // getDay(): 日=0, 月=1, ..., 土=6
  const dow = d.getDay()
  const diff = dow === 0 ? -6 : 1 - dow // 月曜まで戻る
  return ymdAddDays(today, diff)
}

/** 今週（日曜終わり）の終了日 YYYY-MM-DD */
export function endOfWeekISO(today: string = todayLocalISO()): string {
  return ymdAddDays(startOfWeekISO(today), 6)
}

/** 今月の開始日 YYYY-MM-DD */
export function startOfMonthISO(today: string = todayLocalISO()): string {
  const d = parseYmd(today)
  return ymdLocal(new Date(d.getFullYear(), d.getMonth(), 1))
}

/** 今月の終了日 YYYY-MM-DD */
export function endOfMonthISO(today: string = todayLocalISO()): string {
  const d = parseYmd(today)
  return ymdLocal(new Date(d.getFullYear(), d.getMonth() + 1, 0))
}

/** 指定日が start..end の範囲（両端含む）かどうか */
export function isWithinRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end
}

/** 期間の残り日数（end_date 含む） */
export function daysRemaining(endDate: string, today: string = todayLocalISO()): number {
  const start = parseYmd(today).getTime()
  const end = parseYmd(endDate).getTime()
  return Math.max(0, Math.ceil((end - start) / (24 * 60 * 60 * 1000)) + 1)
}

const WEEKDAY_JA = ['日', '月', '火', '水', '木', '金', '土']

/**
 * 「今日」「昨日」「◯日前」「M月D日(曜)」のような、生徒が読みやすい相対日付表記。
 * 7日以内は「◯日前」、それより前は「M月D日(曜)」。
 */
export function formatRelativeDate(date: string, today: string = todayLocalISO()): string {
  if (date === today) return '今日'
  const yesterday = ymdAddDays(today, -1)
  if (date === yesterday) return '昨日'
  const diffMs = parseYmd(today).getTime() - parseYmd(date).getTime()
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000))
  if (diffDays > 0 && diffDays <= 7) return `${diffDays}日前`
  const d = parseYmd(date)
  return `${d.getMonth() + 1}月${d.getDate()}日(${WEEKDAY_JA[d.getDay()]})`
}
