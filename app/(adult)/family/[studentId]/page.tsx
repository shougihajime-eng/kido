import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Calendar,
  ChevronLeft,
  Flame,
  MessageCircle,
  Target,
  TrendingUp
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import {
  computeStreak,
  daysRemaining,
  formatMinutes,
  todayLocalISO,
  ymdAddDays
} from '@/lib/dates'
import { formatLevel } from '@/lib/level'
import { WeeklyBars } from '@/components/dashboard/WeeklyBars'
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown'
import { AnalysisCharts } from '@/app/(student)/analysis/AnalysisCharts'
import { CalendarHeatmap } from '@/app/(student)/calendar/CalendarHeatmap'
import { RecordWithComments } from './RecordWithComments'
import { PrivateModeToggle } from './PrivateModeToggle'
import { fetchCommentsForRecords } from '@/lib/comments-fetch'

export const metadata = {
  title: '生徒の記録'
}

interface PageProps {
  params: Promise<{ studentId: string }>
}

export default async function StudentDetailPage({ params }: PageProps) {
  const { studentId } = await params
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  // 自分のプロフィール（スーパー先生か判定）
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('is_super_teacher')
    .eq('id', user.id)
    .maybeSingle()
  const isSuperTeacher = Boolean(myProfile?.is_super_teacher)

  // 紐づけ確認（スーパー先生は招待なしでも閲覧可）
  const { data: rel } = await supabase
    .from('relationships')
    .select('id, kind')
    .eq('adult_id', user.id)
    .eq('student_id', studentId)
    .maybeSingle()

  if (!rel && !isSuperTeacher) {
    notFound()
  }

  // 生徒情報
  const { data: student } = await supabase
    .from('profiles')
    .select('display_name, level_kind, level_text, avatar_url, private_mode')
    .eq('id', studentId)
    .maybeSingle()

  if (!student) {
    notFound()
  }

  const studentLevelLabel = formatLevel(student.level_kind, student.level_text)

  const today = todayLocalISO()
  const heatmapStart = ymdAddDays(today, -(26 * 7 - 1)) // 26週
  const since30 = ymdAddDays(today, -29)
  const since14 = ymdAddDays(today, -13)
  const weekStart = ymdAddDays(today, -6)

  // 26週分の練習記録
  const { data: longRecords } = await supabase
    .from('training_records')
    .select(
      'id, date, duration_minutes, memo, recorded_at, category:categories(id, name_ja, icon_key, color_token, kind)'
    )
    .eq('user_id', studentId)
    .gte('date', heatmapStart)
    .order('date', { ascending: false })
    .order('recorded_at', { ascending: false })

  type RowWithCat = {
    id: string
    date: string
    duration_minutes: number
    memo: string | null
    recorded_at: string
    category: {
      id: string
      name_ja: string
      icon_key: string
      color_token: string
      kind: string
    } | null
  }
  const records = (longRecords ?? []) as unknown as RowWithCat[]

  // 期間別フィルタ
  const records14 = records.filter((r) => r.date >= since14)
  const records30 = records.filter((r) => r.date >= since30)
  const recordsWeek = records.filter((r) => r.date >= weekStart)
  const shogiDates = Array.from(
    new Set(records.filter((r) => r.category?.kind === 'shogi').map((r) => r.date))
  )
  const { count: streak } = computeStreak(shogiDates)

  // サマリー
  const activeDays14 = new Set(records14.map((r) => r.date)).size
  const totalWeek = recordsWeek.reduce((s, r) => s + r.duration_minutes, 0)

  // 週間棒グラフ（直近7日）— 将棋・生活で分けて積み上げ表示
  const perDayWeek = Array.from({ length: 7 }, (_, i) => {
    const d = ymdAddDays(weekStart, i)
    const dayRecs = recordsWeek.filter((r) => r.date === d)
    const shogi = dayRecs
      .filter((r) => r.category?.kind === 'shogi')
      .reduce((s, r) => s + r.duration_minutes, 0)
    const life = dayRecs
      .filter((r) => r.category?.kind !== 'shogi')
      .reduce((s, r) => s + r.duration_minutes, 0)
    return { date: d, shogi, life }
  })

  // 今週カテゴリ別
  const weekCatMap = new Map<
    string,
    { name_ja: string; color_token: string; minutes: number }
  >()
  for (const r of recordsWeek) {
    const cat = r.category
    if (!cat) continue
    const prev = weekCatMap.get(cat.id)
    if (prev) prev.minutes += r.duration_minutes
    else
      weekCatMap.set(cat.id, {
        name_ja: cat.name_ja,
        color_token: cat.color_token,
        minutes: r.duration_minutes
      })
  }
  const byCategoryThisWeek = Array.from(weekCatMap.entries())
    .map(([category_id, v]) => ({ category_id, ...v }))
    .sort((a, b) => b.minutes - a.minutes)

  // 30日 日次グラフ
  const daily30 = Array.from({ length: 30 }, (_, i) => {
    const d = ymdAddDays(since30, i)
    const minutes = records30
      .filter((r) => r.date === d)
      .reduce((s, r) => s + r.duration_minutes, 0)
    const dt = new Date(d + 'T00:00:00')
    return { date: d, label: `${dt.getMonth() + 1}/${dt.getDate()}`, minutes }
  })

  // 30日 カテゴリ円
  const cat30Map = new Map<
    string,
    { name: string; color: string; minutes: number }
  >()
  for (const r of records30) {
    const cat = r.category
    if (!cat) continue
    const prev = cat30Map.get(cat.id)
    if (prev) prev.minutes += r.duration_minutes
    else
      cat30Map.set(cat.id, {
        name: cat.name_ja,
        color: cat.color_token,
        minutes: r.duration_minutes
      })
  }
  const cat30 = Array.from(cat30Map.values()).sort((a, b) => b.minutes - a.minutes)

  // 30日 時間帯別
  const hourly = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    label: `${h}時`,
    minutes: 0
  }))
  for (const r of records30) {
    const hh = new Date(r.recorded_at).getHours()
    hourly[hh].minutes += r.duration_minutes
  }

  // ヒートマップ用
  const minutesByDate: Record<string, number> = {}
  const recordsByDate: Record<
    string,
    Array<{
      id: string
      date: string
      duration_minutes: number
      memo: string | null
      recorded_at: string
      category: { name_ja: string; icon_key: string; color_token: string } | null
    }>
  > = {}
  for (const r of records) {
    minutesByDate[r.date] = (minutesByDate[r.date] ?? 0) + r.duration_minutes
    const list = recordsByDate[r.date] ?? []
    list.push({
      id: r.id,
      date: r.date,
      duration_minutes: r.duration_minutes,
      memo: r.memo,
      recorded_at: r.recorded_at,
      category: r.category
        ? {
            name_ja: r.category.name_ja,
            icon_key: r.category.icon_key,
            color_token: r.category.color_token
          }
        : null
    })
    recordsByDate[r.date] = list
  }

  // 目標
  const { data: activeGoals } = await supabase
    .from('goals')
    .select('id, period, category_id, target_minutes, start_date, end_date')
    .eq('user_id', studentId)
    .gte('end_date', today)
    .order('end_date', { ascending: true })

  const goalsWithProgress = (activeGoals ?? []).map((g) => {
    const inRange = records.filter((r) => r.date >= g.start_date && r.date <= g.end_date)
    const matching = g.category_id
      ? inRange.filter((r) => r.category?.id === g.category_id)
      : inRange.filter((r) => r.category?.kind === 'shogi')
    const currentMinutes = matching.reduce((s, r) => s + r.duration_minutes, 0)
    const ratio = Math.min(1, currentMinutes / g.target_minutes)
    return {
      id: g.id,
      period: g.period as 'weekly' | 'monthly',
      target: g.target_minutes,
      current: currentMinutes,
      ratio,
      endDate: g.end_date,
      achieved: currentMinutes >= g.target_minutes
    }
  })
  const featuredGoal = goalsWithProgress[0]

  // コメント
  const recordIdsRecent = records14.map((r) => r.id)
  const { byRecord: commentsByRecord, total: totalComments } =
    await fetchCommentsForRecords(supabase, recordIdsRecent, user.id)

  // 共有カテゴリマップ（記録カード用）
  const catMap = new Map<string, { id: string; name_ja: string; color_token: string }>()
  for (const r of records) {
    if (r.category && !catMap.has(r.category.id)) {
      catMap.set(r.category.id, {
        id: r.category.id,
        name_ja: r.category.name_ja,
        color_token: r.category.color_token
      })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/family"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text"
        >
          <ChevronLeft className="w-4 h-4" />
          見守りに戻る
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-surface-elevated flex items-center justify-center text-accent font-num text-2xl font-bold">
            {student.display_name.slice(0, 1)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{student.display_name}</h1>
            {studentLevelLabel && (
              <p className="text-sm font-semibold text-accent mt-0.5">{studentLevelLabel}</p>
            )}
            <p className="text-xs text-text-dim mt-0.5">
              {rel
                ? `${rel.kind === 'parent' ? '親' : '先生'} として見守り中`
                : '全員見守り先生として閲覧中'}
            </p>
          </div>
        </div>
      </header>

      {/* プライベートモード切替（親・先生用） */}
      <PrivateModeToggle
        studentId={studentId}
        studentName={student.display_name as string}
        initialPrivateMode={Boolean(student.private_mode)}
      />

      {/* 大きなサマリー（ぱっと見） */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="今週合計"
          big={totalWeek}
          unit="分"
          sub={totalWeek > 0 ? formatMinutes(totalWeek) : '—'}
          tone="accent"
        />
        <SummaryCard
          icon={<Flame className="w-4 h-4" />}
          label="連続日数"
          big={streak}
          unit="日"
          sub={streak > 0 ? 'がんばってる！' : '今日から'}
          tone="fire"
        />
        <SummaryCard
          icon={<Calendar className="w-4 h-4" />}
          label="14日 記録した日"
          big={activeDays14}
          unit="/14"
          sub={`継続 ${Math.round((activeDays14 / 14) * 100)}%`}
          tone="gold"
        />
        <SummaryCard
          icon={<MessageCircle className="w-4 h-4" />}
          label="コメント"
          big={totalComments}
          unit="件"
          sub="14日間"
          tone="accent"
        />
      </section>

      {/* 目標の達成度 */}
      {featuredGoal && (
        <section className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: featuredGoal.achieved
                  ? 'rgba(5, 150, 105, 0.12)'
                  : 'var(--accent-soft)',
                color: featuredGoal.achieved ? 'var(--success)' : 'var(--accent)'
              }}
            >
              <Target className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">
                {featuredGoal.period === 'weekly' ? '今週' : '今月'}の目標
              </div>
              <div className="text-xs text-text-dim mt-0.5">
                あと {daysRemaining(featuredGoal.endDate, today)} 日 ・ 目標{' '}
                <span className="font-num">{Math.round(featuredGoal.target / 60)}h</span>
              </div>
            </div>
            <div className="text-right">
              <div
                className="font-num text-2xl font-bold"
                style={{
                  color: featuredGoal.achieved ? 'var(--success)' : 'var(--accent)'
                }}
              >
                {Math.round(featuredGoal.ratio * 100)}%
              </div>
              <div className="text-[10px] text-text-dim">
                {Math.round(featuredGoal.current / 60)}h / {Math.round(featuredGoal.target / 60)}h
              </div>
            </div>
          </div>
          <div className="h-2.5 rounded-full bg-surface-elevated overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-700"
              style={{
                width: `${Math.round(featuredGoal.ratio * 100)}%`,
                backgroundColor: featuredGoal.achieved ? 'var(--success)' : 'var(--accent)'
              }}
            />
          </div>
        </section>
      )}

      {/* 週間グラフ */}
      <WeeklyBars perDay={perDayWeek} />

      {/* カテゴリ別今週内訳 */}
      {byCategoryThisWeek.length > 0 && <CategoryBreakdown items={byCategoryThisWeek} />}

      {/* 30日 詳細チャート（日次・カテゴリ円・時間帯） */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-text-muted">
          直近30日のうごき
        </h2>
        <AnalysisCharts daily={daily30} categories={cat30} hourly={hourly} periodDays={30} />
      </section>

      {/* 26週ヒートマップ */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-text-muted">26週カレンダー</h2>
        <CalendarHeatmap
          startDate={heatmapStart}
          endDate={today}
          weeks={26}
          minutesByDate={minutesByDate}
          recordsByDate={recordsByDate}
        />
      </section>

      {/* 記録一覧 + コメント */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-text-muted flex items-center justify-between">
          <span>直近14日の記録</span>
          <span className="text-[10px] text-text-dim font-normal">
            タップで会話する
          </span>
        </h2>
        {records14.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl px-4 py-10 text-center text-sm text-text-dim">
            この期間の記録はまだありません
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {records14.map((r) => {
              const cat = r.category
              return (
                <RecordWithComments
                  key={r.id}
                  record={{
                    id: r.id,
                    date: r.date,
                    duration_minutes: r.duration_minutes,
                    memo: r.memo,
                    category: cat
                      ? {
                          id: cat.id,
                          name_ja: cat.name_ja,
                          color_token: cat.color_token
                        }
                      : null
                  }}
                  comments={commentsByRecord.get(r.id) ?? []}
                  canComment={true}
                />
              )
            })}
          </ul>
        )}
      </section>

      <p className="text-xs text-text-dim leading-relaxed">
        コメントは記録ごとに残せます。生徒からも返信や絵文字が返ってきます。
      </p>
    </div>
  )
}

function SummaryCard({
  icon,
  label,
  big,
  unit,
  sub,
  tone
}: {
  icon: React.ReactNode
  label: string
  big: number
  unit: string
  sub: string
  tone: 'accent' | 'fire' | 'gold'
}) {
  const colorVar =
    tone === 'fire'
      ? 'var(--fire)'
      : tone === 'gold'
        ? 'var(--gold-deep)'
        : 'var(--accent)'
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-1">
      <div
        className="flex items-center gap-1.5 text-[11px] font-semibold"
        style={{ color: colorVar }}
      >
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-baseline gap-1 mt-1">
        <span
          className="font-num text-3xl font-bold tabular-nums"
          style={{ color: colorVar }}
        >
          {big}
        </span>
        <span className="text-xs text-text-muted">{unit}</span>
      </div>
      <div className="text-[11px] text-text-dim mt-0.5">{sub}</div>
    </div>
  )
}
