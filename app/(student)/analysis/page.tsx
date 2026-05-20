import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BarChart3, Clock, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import {
  todayLocalISO,
  ymdAddDays,
  startOfWeekISO,
  endOfWeekISO,
  startOfMonthISO,
  endOfMonthISO
} from '@/lib/dates'
import { AnalysisCharts } from './AnalysisCharts'
import { TimelineDonut, type TimelineSegment } from './TimelineDonut'
import {
  GameResultsView,
  type MonthlyWinRate,
  type OpeningStats
} from './GameResultsView'

export const metadata = {
  title: '分析'
}

type ViewKind = 'period' | '24h' | 'games'
type RangeKind = 'today' | 'week' | 'month'

interface PageProps {
  searchParams: Promise<{
    view?: string
    p?: string
    range?: string
  }>
}

export default async function AnalysisPage({ searchParams }: PageProps) {
  const params = await searchParams
  const view: ViewKind =
    params.view === '24h' ? '24h' : params.view === 'games' ? 'games' : 'period'

  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold">分析</h1>
        <p className="text-base text-text-muted mt-1">
          自分の練習を3つの角度から振り返ろう
        </p>
      </header>

      {/* トップタブ */}
      <ViewTabs current={view} />

      {view === 'period' && <PeriodView userId={user.id} pParam={params.p} />}
      {view === '24h' && <TimelineView userId={user.id} rangeParam={params.range} />}
      {view === 'games' && <GamesView userId={user.id} />}
    </div>
  )
}

function ViewTabs({ current }: { current: ViewKind }) {
  const tabs: { value: ViewKind; label: string; icon: typeof BarChart3 }[] = [
    { value: 'period', label: '期間で見る', icon: BarChart3 },
    { value: '24h', label: '24時間で見る', icon: Clock },
    { value: 'games', label: '対局で見る', icon: Trophy }
  ]
  return (
    <div className="inline-flex self-start rounded-2xl border-2 border-border bg-surface p-1 gap-1 overflow-x-auto max-w-full">
      {tabs.map((t) => {
        const Icon = t.icon
        const active = t.value === current
        return (
          <Link
            key={t.value}
            href={`/analysis?view=${t.value}`}
            className={`h-11 px-4 inline-flex items-center gap-2 rounded-xl text-base font-semibold transition-colors shrink-0 ${
              active
                ? 'bg-accent text-white shadow-[0_2px_8px_rgba(30,64,175,0.2)]'
                : 'text-text-muted hover:text-text hover:bg-surface-overlay'
            }`}
          >
            <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}

/* =====================================================
 * Period view（既存の期間分析）
 * ===================================================== */
async function PeriodView({
  userId,
  pParam
}: {
  userId: string
  pParam: string | undefined
}) {
  const periodDays = pParam === '7' ? 7 : pParam === '90' ? 90 : 30

  const supabase = await createClient()
  const today = todayLocalISO()
  const startDate = ymdAddDays(today, -(periodDays - 1))

  const { data: records } = await supabase
    .from('training_records')
    .select(
      'id, date, duration_minutes, recorded_at, category:categories(id, name_ja, color_token)'
    )
    .eq('user_id', userId)
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
    <>
      <div className="flex items-center justify-end">
        <PeriodSwitcher current={periodDays} />
      </div>

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
          ホームの「今日何してましたか？」から始めよう。
        </p>
      ) : (
        <AnalysisCharts
          daily={dailySeries}
          categories={categorySeries}
          hourly={hourSeries}
          periodDays={periodDays}
        />
      )}
    </>
  )
}

/* =====================================================
 * Timeline view（24時間ドーナツ）
 * ===================================================== */
async function TimelineView({
  userId,
  rangeParam
}: {
  userId: string
  rangeParam: string | undefined
}) {
  const range: RangeKind =
    rangeParam === 'today' ? 'today' : rangeParam === 'month' ? 'month' : 'week'

  const today = todayLocalISO()
  let startDate: string
  let endDate: string
  let totalDays: number
  let periodLabel: string

  if (range === 'today') {
    startDate = today
    endDate = today
    totalDays = 1
    periodLabel = '今日'
  } else if (range === 'month') {
    startDate = startOfMonthISO(today)
    endDate = endOfMonthISO(today)
    // 今月のうち、今日まで＝経過した日数（未来は除外）
    totalDays = parseInt(today.slice(8, 10), 10)
    periodLabel = '今月'
  } else {
    startDate = startOfWeekISO(today)
    endDate = endOfWeekISO(today)
    // 今週のうち、今日まで＝経過した日数
    const startDt = new Date(startDate + 'T00:00:00')
    const todayDt = new Date(today + 'T00:00:00')
    totalDays =
      Math.floor((todayDt.getTime() - startDt.getTime()) / (24 * 60 * 60 * 1000)) + 1
    periodLabel = '今週'
  }

  const supabase = await createClient()
  const { data: records } = await supabase
    .from('training_records')
    .select(
      'date, duration_minutes, category:categories(id, name_ja, icon_key, color_token, kind)'
    )
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)

  type TLRow = {
    date: string
    duration_minutes: number
    category: {
      id: string
      name_ja: string
      icon_key: string
      color_token: string
      kind: string
    } | null
  }

  const rows = (records ?? []) as unknown as TLRow[]
  const byCat = new Map<string, TimelineSegment>()
  for (const r of rows) {
    if (!r.category) continue
    const cur = byCat.get(r.category.id) ?? {
      category_id: r.category.id,
      name: r.category.name_ja,
      icon_key: r.category.icon_key,
      color_token: r.category.color_token,
      kind: (r.category.kind === 'life' ? 'life' : 'shogi') as 'shogi' | 'life',
      minutes: 0
    }
    cur.minutes += r.duration_minutes
    byCat.set(r.category.id, cur)
  }
  const segments = Array.from(byCat.values())

  return (
    <>
      <RangeSwitcher current={range} />
      <TimelineDonut
        segments={segments}
        totalDays={totalDays}
        periodLabel={periodLabel}
      />
    </>
  )
}

/* =====================================================
 * Games view（対局結果）
 * ===================================================== */
async function GamesView({ userId }: { userId: string }) {
  const supabase = await createClient()

  // game_results を training_records.date と JOIN
  const { data: rawGames } = await supabase
    .from('game_results')
    .select(
      'result, opening_tag, training_record:training_records!inner(date)'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  type GameRow = {
    result: 'win' | 'loss' | 'draw' | 'jisho'
    opening_tag: string | null
    training_record: { date: string } | null
  }
  const games = (rawGames ?? []) as unknown as GameRow[]

  // 通算
  let totalWins = 0
  let totalLosses = 0
  let totalDraws = 0
  let totalJisho = 0
  for (const g of games) {
    if (g.result === 'win') totalWins++
    else if (g.result === 'loss') totalLosses++
    else if (g.result === 'draw') totalDraws++
    else if (g.result === 'jisho') totalJisho++
  }

  // 月別集計
  const monthlyMap = new Map<
    string,
    { wins: number; losses: number; draws: number }
  >()
  for (const g of games) {
    const date = g.training_record?.date
    if (!date) continue
    const month = date.slice(0, 7) // YYYY-MM
    const cur = monthlyMap.get(month) ?? { wins: 0, losses: 0, draws: 0 }
    if (g.result === 'win') cur.wins++
    else if (g.result === 'loss') cur.losses++
    else if (g.result === 'draw') cur.draws++
    monthlyMap.set(month, cur)
  }
  const monthly: MonthlyWinRate[] = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(-12) // 直近12ヶ月
    .map(([month, v]) => {
      const decisive = v.wins + v.losses
      const winRate = decisive > 0 ? Math.round((v.wins / decisive) * 100) : 0
      const [, m] = month.split('-')
      return {
        month,
        label: `${parseInt(m, 10)}月`,
        wins: v.wins,
        losses: v.losses,
        draws: v.draws,
        total: v.wins + v.losses + v.draws,
        winRate
      }
    })

  // 戦型別集計
  const openingMap = new Map<string, { wins: number; losses: number; draws: number }>()
  for (const g of games) {
    if (!g.opening_tag) continue
    const cur = openingMap.get(g.opening_tag) ?? { wins: 0, losses: 0, draws: 0 }
    if (g.result === 'win') cur.wins++
    else if (g.result === 'loss') cur.losses++
    else if (g.result === 'draw') cur.draws++
    openingMap.set(g.opening_tag, cur)
  }
  const openings: OpeningStats[] = Array.from(openingMap.entries())
    .map(([tag, v]) => {
      const decisive = v.wins + v.losses
      const winRate = decisive > 0 ? Math.round((v.wins / decisive) * 100) : 0
      return {
        tag,
        wins: v.wins,
        losses: v.losses,
        draws: v.draws,
        total: v.wins + v.losses + v.draws,
        winRate
      }
    })
    .sort((a, b) => b.winRate - a.winRate)

  // 直近30日 vs 前30日 の勝率
  const today = todayLocalISO()
  const start30 = ymdAddDays(today, -29)
  const start60 = ymdAddDays(today, -59)
  const end60 = ymdAddDays(today, -30)

  const recent30 = { wins: 0, losses: 0 }
  const prev30 = { wins: 0, losses: 0 }
  for (const g of games) {
    const date = g.training_record?.date
    if (!date) continue
    if (date >= start30 && date <= today) {
      if (g.result === 'win') recent30.wins++
      else if (g.result === 'loss') recent30.losses++
    } else if (date >= start60 && date <= end60) {
      if (g.result === 'win') prev30.wins++
      else if (g.result === 'loss') prev30.losses++
    }
  }
  const recentWinRate =
    recent30.wins + recent30.losses > 0
      ? Math.round((recent30.wins / (recent30.wins + recent30.losses)) * 100)
      : 0
  const prevWinRate =
    prev30.wins + prev30.losses > 0
      ? Math.round((prev30.wins / (prev30.wins + prev30.losses)) * 100)
      : 0

  return (
    <GameResultsView
      totalWins={totalWins}
      totalLosses={totalLosses}
      totalDraws={totalDraws}
      totalJisho={totalJisho}
      monthly={monthly}
      openings={openings}
      recentWinRate={recentWinRate}
      prevWinRate={prevWinRate}
    />
  )
}

/* =====================================================
 * 共通：KPI / セレクタ
 * ===================================================== */
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
          <Link
            key={o.d}
            href={`/analysis?view=period&p=${o.d}`}
            className={`px-4 h-9 inline-flex items-center justify-center text-sm rounded-full font-num font-medium transition-colors ${
              active ? 'bg-accent text-white' : 'text-text-muted hover:text-text'
            }`}
          >
            {o.label}
          </Link>
        )
      })}
    </div>
  )
}

function RangeSwitcher({ current }: { current: RangeKind }) {
  const opts: { v: RangeKind; label: string }[] = [
    { v: 'today', label: '今日' },
    { v: 'week', label: '今週' },
    { v: 'month', label: '今月' }
  ]
  return (
    <div className="inline-flex self-start rounded-full border border-border p-0.5 bg-surface">
      {opts.map((o) => {
        const active = o.v === current
        return (
          <Link
            key={o.v}
            href={`/analysis?view=24h&range=${o.v}`}
            className={`px-5 h-10 inline-flex items-center justify-center text-sm rounded-full font-medium transition-colors ${
              active ? 'bg-accent text-white' : 'text-text-muted hover:text-text'
            }`}
          >
            {o.label}
          </Link>
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
