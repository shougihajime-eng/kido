import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { todayLocalISO, ymdAddDays } from '@/lib/dates'
import { AnalysisCharts } from './AnalysisCharts'

export const metadata = {
  title: '分析'
}

interface PageProps {
  searchParams: Promise<{ p?: string }>
}

export default async function AnalysisPage({ searchParams }: PageProps) {
  const { p } = await searchParams
  const periodDays = p === '7' ? 7 : p === '90' ? 90 : 30

  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = todayLocalISO()
  const startDate = ymdAddDays(today, -(periodDays - 1))

  const { data: records } = await supabase
    .from('training_records')
    .select(
      'id, date, duration_minutes, recorded_at, category:categories(id, name_ja, color_token)'
    )
    .eq('user_id', user.id)
    .gte('date', startDate)
    .order('date', { ascending: true })

  type Row = {
    id: string
    date: string
    duration_minutes: number
    recorded_at: string
    category: { id: string; name_ja: string; color_token: string } | null
  }
  const rows = (records ?? []) as unknown as Row[]

  const byDate = new Map<string, number>()
  for (const r of rows) byDate.set(r.date, (byDate.get(r.date) ?? 0) + r.duration_minutes)

  const dailySeries: { date: string; label: string; minutes: number }[] = []
  for (let i = 0; i < periodDays; i++) {
    const d = ymdAddDays(startDate, i)
    const m = byDate.get(d) ?? 0
    const dt = new Date(d)
    dailySeries.push({
      date: d,
      label: `${dt.getMonth() + 1}/${dt.getDate()}`,
      minutes: m
    })
  }

  const byCategory = new Map<string, { name: string; color: string; minutes: number }>()
  for (const r of rows) {
    if (!r.category) continue
    const cur = byCategory.get(r.category.id) ?? {
      name: r.category.name_ja,
      color: r.category.color_token,
      minutes: 0
    }
    cur.minutes += r.duration_minutes
    byCategory.set(r.category.id, cur)
  }
  const categorySeries = Array.from(byCategory.values()).sort((a, b) => b.minutes - a.minutes)

  const byHour = new Array<number>(24).fill(0)
  for (const r of rows) {
    const h = new Date(r.recorded_at).getHours()
    byHour[h] += r.duration_minutes
  }
  const hourSeries = byHour.map((m, h) => ({ hour: h, label: `${h}時`, minutes: m }))

  const totalMinutes = rows.reduce((s, r) => s + r.duration_minutes, 0)
  const dailyAvg = Math.round(totalMinutes / periodDays)
  const activeDays = byDate.size
  const activeDayAvg = activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">分析</h1>
        <PeriodSwitcher current={periodDays} />
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi label="合計時間" value={formatMinutesShort(totalMinutes)} />
        <Kpi label="1日平均" value={formatMinutesShort(dailyAvg)} />
        <Kpi label="記録日数" value={`${activeDays}`} sub="日" />
        <Kpi label="記録日平均" value={formatMinutesShort(activeDayAvg)} />
      </section>

      {totalMinutes === 0 ? (
        <p className="text-center text-text-dim text-sm py-12">
          この期間の記録がありません。
          <br />
          ホームの「今、何してた？」から始めよう。
        </p>
      ) : (
        <AnalysisCharts
          daily={dailySeries}
          categories={categorySeries}
          hourly={hourSeries}
          periodDays={periodDays}
        />
      )}
    </div>
  )
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-1">
      <span className="text-xs text-text-muted">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="font-num text-2xl font-bold tabular-nums">{value}</span>
        {sub && <span className="text-xs text-text-dim">{sub}</span>}
      </div>
    </div>
  )
}

function PeriodSwitcher({ current }: { current: number }) {
  const opts = [
    { d: 7, label: '7日' },
    { d: 30, label: '30日' },
    { d: 90, label: '90日' }
  ]
  return (
    <div className="inline-flex rounded-full border border-border p-0.5 bg-surface">
      {opts.map((o) => {
        const active = o.d === current
        return (
          <a
            key={o.d}
            href={`/analysis?p=${o.d}`}
            className={`px-3 h-8 inline-flex items-center justify-center text-xs rounded-full font-num font-medium transition-colors ${
              active ? 'bg-accent text-white' : 'text-text-muted hover:text-text'
            }`}
          >
            {o.label}
          </a>
        )
      })}
    </div>
  )
}

function formatMinutesShort(minutes: number): string {
  if (minutes < 60) return `${minutes}分`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}時間`
  return `${h}時間${m}分`
}
