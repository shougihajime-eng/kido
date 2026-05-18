import Link from 'next/link'
import { ChevronRight, Flame, KeyRound, PlusCircle, UsersRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AnimatedNumber } from '@/app/components/AnimatedNumber'
import { getCategoryIcon, categoryColorVar } from '@/lib/category-icon'
import { computeStreak, formatMinutes, todayLocalISO, ymdAddDays } from '@/lib/dates'
import { WeeklyBars } from '@/components/dashboard/WeeklyBars'
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown'

export const metadata = {
  title: 'ホーム'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  const today = todayLocalISO()
  const weekStart = ymdAddDays(today, -6) // 直近7日（今日含む）

  const nowIso = new Date().toISOString()
  const [{ data: profile }, { data: records30 }, { count: linkedCount }, { count: activeCodes }] =
    await Promise.all([
      supabase.from('profiles').select('display_name, role').eq('id', user!.id).maybeSingle(),
      supabase
        .from('training_records')
        .select(
          'id, date, duration_minutes, memo, recorded_at, category:categories(id, name_ja, icon_key, color_token)'
        )
        .eq('user_id', user!.id)
        .gte('date', ymdAddDays(today, -29))
        .order('date', { ascending: false })
        .order('recorded_at', { ascending: false }),
      supabase
        .from('relationships')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', user!.id),
      supabase
        .from('invite_codes')
        .select('code', { count: 'exact', head: true })
        .eq('student_id', user!.id)
        .is('used_at', null)
        .gt('expires_at', nowIso)
    ])

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
    } | null
  }
  const records = (records30 ?? []) as unknown as RowWithCat[]

  const todayRecords = records.filter((r) => r.date === today)
  const weekRecords = records.filter((r) => r.date >= weekStart)
  const todayMinutes = todayRecords.reduce((s, r) => s + r.duration_minutes, 0)
  const weekMinutes = weekRecords.reduce((s, r) => s + r.duration_minutes, 0)

  const distinctDates = Array.from(new Set(records.map((r) => r.date)))
  const { count: streak, needsToday } = computeStreak(distinctDates)

  // 直近7日（古→新）の合計分
  const perDay = Array.from({ length: 7 }, (_, i) => {
    const d = ymdAddDays(weekStart, i)
    const minutes = weekRecords
      .filter((r) => r.date === d)
      .reduce((s, r) => s + r.duration_minutes, 0)
    return { date: d, minutes }
  })

  // カテゴリ別の今週合計
  const catMap = new Map<
    string,
    { name_ja: string; color_token: string; minutes: number }
  >()
  for (const r of weekRecords) {
    const cat = r.category
    if (!cat) continue
    const prev = catMap.get(cat.id)
    if (prev) prev.minutes += r.duration_minutes
    else
      catMap.set(cat.id, {
        name_ja: cat.name_ja,
        color_token: cat.color_token,
        minutes: r.duration_minutes
      })
  }
  const byCategoryThisWeek = Array.from(catMap.entries())
    .map(([category_id, v]) => ({ category_id, ...v }))
    .sort((a, b) => b.minutes - a.minutes)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-baseline justify-between">
        <div className="flex flex-col">
          <span className="text-text-dim text-xs font-num tracking-widest uppercase">KIDO</span>
          <h1 className="text-2xl font-bold">
            {profile?.display_name ? `${profile.display_name} さん` : 'ホーム'}
          </h1>
        </div>
        <form action="/auth/sign-out" method="post">
          <button type="submit" className="text-text-dim text-xs hover:text-text-muted underline">
            ログアウト
          </button>
        </form>
      </header>

      {/* 今日の合計 */}
      <section className="bg-surface border border-border rounded-3xl p-8 flex flex-col items-center gap-2">
        <span className="text-sm text-text-muted">今日の合計</span>
        <div className="flex items-baseline gap-2">
          <AnimatedNumber
            value={todayMinutes}
            duration={1.6}
            className="font-num text-display font-bold gold-glow tabular-nums"
          />
          <span className="text-lg text-text-muted">分</span>
        </div>
        <span className="text-xs text-text-dim font-num">
          {todayMinutes > 0 ? formatMinutes(todayMinutes) : 'まだ記録がありません'}
        </span>
      </section>

      {/* CTA：今、何してた？ */}
      <Link
        href="/record"
        className="group relative overflow-hidden flex items-center justify-center gap-3 h-16 rounded-2xl bg-accent text-background font-bold text-lg shadow-[0_0_32px_rgba(212,162,76,0.35)] hover:bg-accent-deep hover:shadow-[0_0_48px_rgba(212,162,76,0.5)] transition-all active:scale-[0.98]"
      >
        <PlusCircle className="h-6 w-6 transition-transform group-hover:rotate-90" />
        今、何してた？
      </Link>

      {/* ストリーク + 今週合計 */}
      <section className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-2">
          <span className="text-sm text-text-muted">連続日数</span>
          <div className="flex items-baseline gap-2">
            <AnimatedNumber
              value={streak}
              duration={1.2}
              className="font-num text-3xl font-bold tabular-nums"
            />
            <Flame
              className={`h-6 w-6 ${streak > 0 ? 'flame-flicker text-fire' : 'text-text-dim'}`}
              fill={streak > 0 ? 'currentColor' : 'none'}
            />
          </div>
          {needsToday && streak > 0 && (
            <span className="text-xs text-fire-bright">今日記録するとキープ！</span>
          )}
          {streak === 0 && (
            <span className="text-xs text-text-dim">今日から始めよう</span>
          )}
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-2">
          <span className="text-sm text-text-muted">今週合計</span>
          <div className="flex items-baseline gap-1">
            <AnimatedNumber
              value={weekMinutes}
              duration={1.4}
              className="font-num text-3xl font-bold tabular-nums"
            />
            <span className="text-sm text-text-muted">分</span>
          </div>
          <span className="text-xs text-text-dim font-num">
            {weekMinutes > 0 ? formatMinutes(weekMinutes) : '—'}
          </span>
        </div>
      </section>

      {/* 週間グラフ */}
      <WeeklyBars perDay={perDay} />

      {/* カテゴリ別今週内訳（記録があれば）*/}
      {byCategoryThisWeek.length > 0 && (
        <CategoryBreakdown items={byCategoryThisWeek} />
      )}

      {/* 今日の記録リスト */}
      {todayRecords.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm text-text-muted">今日の記録</h2>
          <ul className="flex flex-col gap-2">
            {todayRecords.map((r) => {
              const cat = r.category
              const Icon = getCategoryIcon(cat?.icon_key ?? 'plus')
              const color = categoryColorVar(cat?.color_token ?? 'cat-other')
              return (
                <li
                  key={r.id}
                  className="flex items-center gap-3 bg-surface border border-border rounded-2xl p-3"
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: color + '22', color }}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.2} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-text truncate">{cat?.name_ja ?? '—'}</div>
                    {r.memo && (
                      <div className="text-xs text-text-muted truncate">{r.memo}</div>
                    )}
                  </div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="font-num font-bold tabular-nums">{r.duration_minutes}</span>
                    <span className="text-xs text-text-muted">分</span>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* 親・先生を招待 */}
      <Link
        href="/code"
        className="group flex items-center gap-3 bg-surface border border-border hover:border-accent rounded-2xl p-4 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center">
          {(linkedCount ?? 0) > 0 ? (
            <UsersRound className="w-5 h-5" />
          ) : (
            <KeyRound className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">
            {(linkedCount ?? 0) > 0
              ? `${linkedCount}人が見守り中`
              : '親・先生を招待する'}
          </div>
          <div className="text-xs text-text-dim mt-0.5">
            {(activeCodes ?? 0) > 0
              ? `招待コード ${activeCodes}枚 が有効`
              : '8文字のコードを発行して渡そう'}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-text-dim group-hover:text-accent transition-colors" />
      </Link>

      <p className="text-center text-xs text-text-dim">
        ログイン中: <span className="font-num text-accent">{user?.email}</span>
      </p>
    </div>
  )
}
