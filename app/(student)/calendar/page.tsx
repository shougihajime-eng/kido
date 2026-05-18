import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { todayLocalISO, ymdAddDays } from '@/lib/dates'
import { CalendarHeatmap } from './CalendarHeatmap'

export const metadata = {
  title: 'カレンダー'
}

const WEEKS = 26 // 26週（約半年）

export default async function CalendarPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = todayLocalISO()
  const startDate = ymdAddDays(today, -(WEEKS * 7 - 1))

  // 練習記録（カテゴリ付き）
  const { data: records } = await supabase
    .from('training_records')
    .select(
      'id, date, duration_minutes, memo, recorded_at, category:categories(name_ja, icon_key, color_token)'
    )
    .eq('user_id', user.id)
    .gte('date', startDate)
    .order('date', { ascending: true })
    .order('recorded_at', { ascending: true })

  type RecRow = {
    id: string
    date: string
    duration_minutes: number
    memo: string | null
    recorded_at: string
    category: { name_ja: string; icon_key: string; color_token: string } | null
  }
  const rows = (records ?? []) as unknown as RecRow[]

  // 日付ごとに集計
  const dayMap = new Map<
    string,
    { total: number; count: number; records: RecRow[] }
  >()
  for (const r of rows) {
    const cur = dayMap.get(r.date) ?? { total: 0, count: 0, records: [] }
    cur.total += r.duration_minutes
    cur.count += 1
    cur.records.push(r)
    dayMap.set(r.date, cur)
  }

  // 期間サマリー
  const totalMinutes = rows.reduce((s, r) => s + r.duration_minutes, 0)
  const activeDays = dayMap.size
  const totalDays = WEEKS * 7
  const consistency = Math.round((activeDays / totalDays) * 100)

  // ヒートマップ用：日付→分の単純マップ
  const minutesByDate: Record<string, number> = {}
  const recordsByDate: Record<string, RecRow[]> = {}
  for (const [date, v] of dayMap.entries()) {
    minutesByDate[date] = v.total
    recordsByDate[date] = v.records
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">カレンダー</h1>
        <p className="text-sm text-text-muted">直近 {WEEKS} 週間の積み上げ</p>
      </header>

      {/* サマリー */}
      <section className="grid grid-cols-3 gap-3">
        <SummaryCard label="期間合計" value={formatHours(totalMinutes)} sub="時間" />
        <SummaryCard label="記録日数" value={`${activeDays}`} sub={`/ ${totalDays}日`} />
        <SummaryCard label="継続率" value={`${consistency}`} sub="%" />
      </section>

      <CalendarHeatmap
        startDate={startDate}
        endDate={today}
        weeks={WEEKS}
        minutesByDate={minutesByDate}
        recordsByDate={recordsByDate}
      />
    </div>
  )
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-1">
      <span className="text-xs text-text-muted">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="font-num text-2xl font-bold tabular-nums gold-glow">{value}</span>
        <span className="text-xs text-text-dim">{sub}</span>
      </div>
    </div>
  )
}

function formatHours(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  return `${h}`
}
