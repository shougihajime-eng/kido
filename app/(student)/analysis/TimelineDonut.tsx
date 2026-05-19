'use client'

import { useMemo } from 'react'
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from 'recharts'
import { motion } from 'framer-motion'
import { categoryColorVar, getCategoryIcon } from '@/lib/category-icon'

export interface TimelineSegment {
  category_id: string
  name: string
  icon_key: string
  color_token: string
  kind: 'shogi' | 'life'
  minutes: number
}

interface Props {
  segments: TimelineSegment[]
  totalDays: number
  periodLabel: string // 例: '今日' / '今週' / '今月'
}

const UNTRACKED_COLOR = '#d6cdb5' // 未記録：ベージュ
const UNTRACKED_NAME = '未記録'

function formatHours(minutes: number): string {
  if (minutes < 60) return `${minutes}分`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}時間`
  return `${h}h ${m}分`
}

export function TimelineDonut({ segments, totalDays, periodLabel }: Props) {
  const totalAvailable = 24 * 60 * totalDays // 期間内のフル分数（24時間×日数）
  const recordedMinutes = useMemo(
    () => segments.reduce((s, seg) => s + seg.minutes, 0),
    [segments]
  )
  const untrackedMinutes = Math.max(0, totalAvailable - recordedMinutes)

  const shogiMinutes = useMemo(
    () => segments.filter((s) => s.kind === 'shogi').reduce((s, x) => s + x.minutes, 0),
    [segments]
  )
  const lifeMinutes = useMemo(
    () => segments.filter((s) => s.kind === 'life').reduce((s, x) => s + x.minutes, 0),
    [segments]
  )

  const shogiPct = totalAvailable > 0 ? Math.round((shogiMinutes / totalAvailable) * 100) : 0

  // チャート用データ：将棋 → 生活 → 未記録 の順
  const chartData = useMemo(() => {
    const shogi = segments.filter((s) => s.kind === 'shogi')
    const life = segments.filter((s) => s.kind === 'life')
    return [
      ...shogi.map((s) => ({
        name: s.name,
        color: categoryColorVar(s.color_token),
        value: s.minutes,
        kind: 'shogi' as const,
        icon_key: s.icon_key
      })),
      ...life.map((s) => ({
        name: s.name,
        color: categoryColorVar(s.color_token),
        value: s.minutes,
        kind: 'life' as const,
        icon_key: s.icon_key
      })),
      ...(untrackedMinutes > 0
        ? [
            {
              name: UNTRACKED_NAME,
              color: UNTRACKED_COLOR,
              value: untrackedMinutes,
              kind: 'untracked' as const,
              icon_key: 'plus'
            }
          ]
        : [])
    ]
  }, [segments, untrackedMinutes])

  const hasAnyRecord = recordedMinutes > 0

  return (
    <div className="flex flex-col gap-6">
      {/* メインドーナツ */}
      <section className="bg-surface border border-border rounded-3xl p-6 flex flex-col items-center gap-4 card-shadow">
        <div className="text-sm text-text-muted">{periodLabel}の時間の使い方</div>

        {!hasAnyRecord ? (
          <div className="py-12 text-center text-text-muted">
            <p className="text-base mb-2">この期間の記録がありません</p>
            <p className="text-sm text-text-dim">
              ホームの「今日何してましたか？」から始めよう
            </p>
          </div>
        ) : (
          <>
            <div className="relative w-full max-w-sm aspect-square">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="62%"
                    outerRadius="92%"
                    paddingAngle={1.5}
                    startAngle={90}
                    endAngle={-270}
                    isAnimationActive
                    animationDuration={1100}
                  >
                    {chartData.map((d, i) => (
                      <Cell
                        key={i}
                        fill={d.color}
                        stroke="var(--surface)"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* 中央表示 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.4 }}
                  className="flex flex-col items-center"
                >
                  <span className="text-xs text-text-muted">将棋に使った</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-num text-5xl md:text-6xl font-bold tabular-nums text-accent">
                      {shogiPct}
                    </span>
                    <span className="text-2xl text-accent">%</span>
                  </div>
                  <span className="text-xs text-text-dim font-num">
                    {formatHours(shogiMinutes)}
                  </span>
                </motion.div>
              </div>
            </div>

            {/* サマリーバー：将棋 / 生活 / 未記録 */}
            <div className="w-full grid grid-cols-3 gap-2 mt-2">
              <SummaryTile
                label="将棋"
                minutes={shogiMinutes}
                total={totalAvailable}
                color="var(--accent)"
              />
              <SummaryTile
                label="生活"
                minutes={lifeMinutes}
                total={totalAvailable}
                color="var(--gold-deep)"
              />
              <SummaryTile
                label="未記録"
                minutes={untrackedMinutes}
                total={totalAvailable}
                color={UNTRACKED_COLOR}
              />
            </div>
          </>
        )}
      </section>

      {/* カテゴリ別内訳リスト */}
      {hasAnyRecord && (
        <section className="bg-surface border border-border rounded-3xl p-5 flex flex-col gap-3">
          <h2 className="text-base font-bold text-text-muted">カテゴリ別</h2>
          <ul className="flex flex-col gap-2.5">
            {segments
              .slice()
              .sort((a, b) => b.minutes - a.minutes)
              .map((seg) => {
                const Icon = getCategoryIcon(seg.icon_key)
                const color = categoryColorVar(seg.color_token)
                const pct =
                  totalAvailable > 0
                    ? Math.round((seg.minutes / totalAvailable) * 100)
                    : 0
                return (
                  <li key={seg.category_id} className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                      style={{ backgroundColor: color + '22', color }}
                    >
                      <Icon className="h-5 w-5" strokeWidth={2.2} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-base font-semibold truncate">
                          {seg.name}
                          {seg.kind === 'life' && (
                            <span className="ml-1.5 text-[10px] text-text-dim font-normal">
                              生活
                            </span>
                          )}
                        </span>
                        <span className="text-sm text-text-muted font-num tabular-nums shrink-0">
                          {formatHours(seg.minutes)}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-surface-overlay overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-text-dim font-num tabular-nums w-10 text-right shrink-0">
                      {pct}%
                    </span>
                  </li>
                )
              })}
          </ul>
        </section>
      )}
    </div>
  )
}

function SummaryTile({
  label,
  minutes,
  total,
  color
}: {
  label: string
  minutes: number
  total: number
  color: string
}) {
  const pct = total > 0 ? Math.round((minutes / total) * 100) : 0
  return (
    <div className="bg-surface-overlay rounded-xl p-3 flex flex-col items-center gap-0.5">
      <span className="text-[11px] text-text-muted">{label}</span>
      <div className="flex items-baseline gap-0.5">
        <span
          className="font-num text-xl font-bold tabular-nums"
          style={{ color }}
        >
          {pct}
        </span>
        <span className="text-xs text-text-muted">%</span>
      </div>
      <span className="text-[10px] text-text-dim font-num">
        {formatHours(minutes)}
      </span>
    </div>
  )
}

function DonutTooltip({
  active,
  payload
}: {
  active?: boolean
  payload?: Array<{ payload: { name: string; value: number; color: string } }>
}) {
  if (!active || !payload || payload.length === 0) return null
  const p = payload[0].payload
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 text-sm shadow-lg">
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-sm"
          style={{ backgroundColor: p.color }}
        />
        <span className="font-semibold">{p.name}</span>
      </div>
      <div className="font-num text-base font-bold mt-1">
        {formatHours(p.value)}
      </div>
    </div>
  )
}
