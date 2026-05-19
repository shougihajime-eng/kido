'use client'

import { motion } from 'framer-motion'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { Trophy } from 'lucide-react'

export interface MonthlyWinRate {
  month: string // '2026-04'
  label: string // '4月'
  wins: number
  losses: number
  draws: number
  total: number
  winRate: number // 0-100
}

export interface OpeningStats {
  tag: string
  wins: number
  losses: number
  draws: number
  total: number
  winRate: number // 0-100
}

interface Props {
  totalWins: number
  totalLosses: number
  totalDraws: number
  totalJisho: number
  monthly: MonthlyWinRate[]
  openings: OpeningStats[]
  recentWinRate: number // 直近30日勝率
  prevWinRate: number // 31〜60日前の勝率
}

const OPENING_MIN = 3 // 戦型別は最低3局必要

export function GameResultsView({
  totalWins,
  totalLosses,
  totalDraws,
  totalJisho,
  monthly,
  openings,
  recentWinRate,
  prevWinRate
}: Props) {
  const totalGames = totalWins + totalLosses + totalDraws + totalJisho

  if (totalGames === 0) {
    return (
      <section className="bg-surface border border-border rounded-3xl p-10 flex flex-col items-center gap-4 text-center card-shadow">
        <div className="h-16 w-16 rounded-2xl bg-accent-soft flex items-center justify-center text-accent">
          <Trophy className="h-8 w-8" strokeWidth={2} />
        </div>
        <div>
          <p className="text-lg font-bold">まだ対局結果がありません</p>
          <p className="text-sm text-text-muted mt-2 leading-relaxed">
            「今日何してましたか？」→「実戦」を選んで記録すると、
            <br />
            勝敗と戦型を入れられます。ここに勝率が積み上がっていきます。
          </p>
        </div>
      </section>
    )
  }

  const overallWinRate = Math.round(
    ((totalWins) / Math.max(1, totalWins + totalLosses)) * 100
  )
  const diff = recentWinRate - prevWinRate

  return (
    <div className="flex flex-col gap-6">
      {/* ヒーロー：通算勝率 */}
      <section className="bg-surface border-2 border-accent rounded-3xl p-6 md:p-8 flex flex-col items-center gap-3 card-shadow">
        <span className="text-sm text-text-muted">通算勝率</span>
        <div className="flex items-baseline gap-1">
          <span className="font-num text-display font-bold gold-glow tabular-nums">
            {overallWinRate}
          </span>
          <span className="text-3xl text-accent">%</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-success font-num font-bold">{totalWins}勝</span>
          <span className="text-danger font-num font-bold">{totalLosses}敗</span>
          {totalDraws > 0 && (
            <span className="text-text-muted font-num">{totalDraws}分</span>
          )}
          {totalJisho > 0 && (
            <span className="text-text-muted font-num">{totalJisho}持</span>
          )}
          <span className="text-text-dim">（全{totalGames}局）</span>
        </div>
      </section>

      {/* 直近30日 vs 前30日 */}
      <section className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-1">
          <span className="text-xs text-text-muted">直近30日</span>
          <div className="flex items-baseline gap-1">
            <span className="font-num text-3xl font-bold tabular-nums text-accent">
              {recentWinRate}
            </span>
            <span className="text-sm text-text-muted">%</span>
          </div>
          {diff !== 0 && (
            <span
              className={`text-xs font-num font-semibold ${
                diff > 0 ? 'text-success' : 'text-warning'
              }`}
            >
              {diff > 0 ? '↑ +' : '↓ '}
              {Math.abs(diff)}% (前30日比)
            </span>
          )}
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-1">
          <span className="text-xs text-text-muted">前30日</span>
          <div className="flex items-baseline gap-1">
            <span className="font-num text-3xl font-bold tabular-nums text-text-muted">
              {prevWinRate}
            </span>
            <span className="text-sm text-text-muted">%</span>
          </div>
          <span className="text-xs text-text-dim">基準</span>
        </div>
      </section>

      {/* 月別勝率推移 */}
      {monthly.length > 0 && (
        <section className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
          <h2 className="text-base font-bold text-text-muted">月別の勝率推移</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthly}
                margin={{ top: 8, right: 10, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  stroke="var(--border)"
                  strokeDasharray="2 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{
                    fill: 'var(--text-muted)',
                    fontSize: 12,
                    fontFamily: 'var(--font-num)'
                  }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{
                    fill: 'var(--text-dim)',
                    fontSize: 11,
                    fontFamily: 'var(--font-num)'
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                  width={42}
                />
                <Tooltip content={<MonthlyTooltip />} />
                <Line
                  type="monotone"
                  dataKey="winRate"
                  stroke="var(--accent)"
                  strokeWidth={3}
                  dot={{
                    fill: 'var(--accent)',
                    r: 5,
                    strokeWidth: 0
                  }}
                  activeDot={{
                    r: 7,
                    fill: 'var(--sakura)',
                    strokeWidth: 0
                  }}
                  isAnimationActive
                  animationDuration={1100}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* 戦型別勝率 */}
      {openings.filter((o) => o.total >= OPENING_MIN).length > 0 ? (
        <section className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
          <h2 className="text-base font-bold text-text-muted">
            戦型別の勝率
            <span className="ml-2 text-[11px] text-text-dim font-normal font-num">
              (3局以上の戦型のみ)
            </span>
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={openings.filter((o) => o.total >= OPENING_MIN)}
                layout="vertical"
                margin={{ top: 4, right: 10, bottom: 4, left: 6 }}
              >
                <CartesianGrid
                  stroke="var(--border)"
                  strokeDasharray="2 3"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{
                    fill: 'var(--text-dim)',
                    fontSize: 11,
                    fontFamily: 'var(--font-num)'
                  }}
                  tickFormatter={(v) => `${v}%`}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="tag"
                  tick={{
                    fill: 'var(--text-muted)',
                    fontSize: 13
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip content={<OpeningTooltip />} />
                <Bar
                  dataKey="winRate"
                  radius={[0, 6, 6, 0]}
                  isAnimationActive
                  animationDuration={900}
                >
                  {openings
                    .filter((o) => o.total >= OPENING_MIN)
                    .map((o, i) => (
                      <Cell
                        key={i}
                        fill={
                          o.winRate >= 60
                            ? 'var(--success)'
                            : o.winRate >= 45
                              ? 'var(--accent)'
                              : 'var(--warning)'
                        }
                      />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-text-dim text-center">
            得意（緑） · 普通（藍） · これからの伸びしろ（橙）
          </p>
        </section>
      ) : null}

      {/* 戦型別の対局数（少ない戦型の表示） */}
      {openings.length > 0 && (
        <section className="bg-surface-overlay border border-border rounded-2xl p-4 flex flex-col gap-2">
          <h3 className="text-sm text-text-muted">記録した戦型一覧</h3>
          <ul className="flex flex-wrap gap-1.5">
            {openings.map((o) => (
              <li
                key={o.tag}
                className="inline-flex items-center gap-1.5 text-xs bg-surface border border-border rounded-full px-3 py-1"
              >
                <span className="font-medium">{o.tag}</span>
                <span className="text-text-muted font-num">
                  {o.wins}-{o.losses}
                  {o.draws > 0 ? `-${o.draws}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function MonthlyTooltip({
  active,
  payload
}: {
  active?: boolean
  payload?: Array<{ payload: MonthlyWinRate }>
}) {
  if (!active || !payload || payload.length === 0) return null
  const m = payload[0].payload
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 text-sm shadow-lg">
      <div className="font-semibold mb-1">{m.label}</div>
      <div className="flex items-baseline gap-1">
        <span className="font-num text-xl font-bold text-accent">{m.winRate}</span>
        <span className="text-xs text-text-muted">%</span>
      </div>
      <div className="text-xs text-text-muted font-num mt-0.5">
        {m.wins}勝 {m.losses}敗 {m.draws > 0 && `${m.draws}分`}
      </div>
    </div>
  )
}

function OpeningTooltip({
  active,
  payload
}: {
  active?: boolean
  payload?: Array<{ payload: OpeningStats }>
}) {
  if (!active || !payload || payload.length === 0) return null
  const o = payload[0].payload
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 text-sm shadow-lg">
      <div className="font-semibold mb-1">{o.tag}</div>
      <div className="flex items-baseline gap-1">
        <span className="font-num text-xl font-bold text-accent">{o.winRate}</span>
        <span className="text-xs text-text-muted">%</span>
      </div>
      <div className="text-xs text-text-muted font-num mt-0.5">
        {o.wins}勝 {o.losses}敗（{o.total}局）
      </div>
    </div>
  )
}
