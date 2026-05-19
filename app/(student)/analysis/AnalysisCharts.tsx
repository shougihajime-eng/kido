'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

interface Props {
  daily: { date: string; label: string; minutes: number }[]
  categories: { name: string; color: string; minutes: number }[]
  hourly: { hour: number; label: string; minutes: number }[]
  periodDays: number
}

const ACCENT = '#1e40af'
const ACCENT_GLOW = '#3b82f6'

export function AnalysisCharts({ daily, categories, hourly, periodDays }: Props) {
  const peakHour = hourly.reduce(
    (max, cur) => (cur.minutes > max.minutes ? cur : max),
    hourly[0] ?? { hour: 0, label: '0時', minutes: 0 }
  )
  const totalCategoryMinutes = categories.reduce((s, c) => s + c.minutes, 0)

  // 日付ラベルの間引き（90日表示は全部出すと潰れるので適度に）
  const xTickStride = periodDays >= 90 ? 14 : periodDays >= 30 ? 5 : 1

  return (
    <div className="flex flex-col gap-6">
      {/* 時系列：日次練習時間 */}
      <section className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2">
        <h2 className="text-sm text-text-muted">日次練習時間（分）</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daily} margin={{ top: 8, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="dailyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ACCENT_GLOW} stopOpacity={0.7} />
                  <stop offset="100%" stopColor={ACCENT} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'var(--font-num)' }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
                interval={xTickStride - 1}
              />
              <YAxis
                tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'var(--font-num)' }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip content={<DarkTooltip suffix="分" />} cursor={{ fill: 'rgba(30,64,175,0.06)' }} />
              <Area
                type="monotone"
                dataKey="minutes"
                stroke={ACCENT_GLOW}
                strokeWidth={2}
                fill="url(#dailyGradient)"
                isAnimationActive
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* カテゴリ別 */}
      <section className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
        <h2 className="text-sm text-text-muted">カテゴリ別の内訳</h2>
        {categories.length === 0 ? (
          <p className="text-xs text-text-dim text-center py-4">この期間の記録がありません</p>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="h-40 w-40 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="minutes"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={70}
                    paddingAngle={2}
                    isAnimationActive
                    animationDuration={1200}
                  >
                    {categories.map((c, i) => (
                      <Cell key={i} fill={`var(--${c.color})`} stroke="var(--surface)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<DarkTooltip suffix="分" />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex-1 flex flex-col gap-2 w-full">
              {categories.map((c) => {
                const pct = totalCategoryMinutes > 0 ? Math.round((c.minutes / totalCategoryMinutes) * 100) : 0
                return (
                  <li key={c.name} className="flex items-center gap-2 text-sm">
                    <span
                      className="h-3 w-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: `var(--${c.color})` }}
                    />
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="font-num font-medium tabular-nums">{c.minutes}</span>
                    <span className="text-xs text-text-dim w-10 text-right font-num tabular-nums">
                      {pct}%
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </section>

      {/* 時間帯別 */}
      <section className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm text-text-muted">時間帯別の集中</h2>
          {peakHour.minutes > 0 && (
            <span className="text-xs text-text-dim font-num">
              ピーク: <span className="text-accent font-semibold">{peakHour.label}</span>
            </span>
          )}
        </div>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourly} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
              <XAxis
                dataKey="hour"
                tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'var(--font-num)' }}
                tickFormatter={(v) => (v % 6 === 0 ? `${v}時` : '')}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
                interval={0}
              />
              <YAxis hide />
              <Tooltip content={<DarkTooltip suffix="分" labelFormatter={(h) => `${h}時台`} />} cursor={{ fill: 'rgba(30,64,175,0.06)' }} />
              <Bar
                dataKey="minutes"
                radius={[4, 4, 0, 0]}
                isAnimationActive
                animationDuration={1000}
              >
                {hourly.map((h) => (
                  <Cell
                    key={h.hour}
                    fill={h.hour === peakHour.hour && peakHour.minutes > 0 ? ACCENT_GLOW : ACCENT}
                    fillOpacity={h.hour === peakHour.hour && peakHour.minutes > 0 ? 1 : 0.55}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}

function DarkTooltip({
  active,
  payload,
  label,
  suffix,
  labelFormatter
}: {
  active?: boolean
  payload?: Array<{ value: number; name?: string }>
  label?: string | number
  suffix?: string
  labelFormatter?: (l: string | number) => string
}) {
  if (!active || !payload || payload.length === 0) return null
  const v = payload[0]
  const displayLabel = labelFormatter ? labelFormatter(label ?? '') : label
  return (
    <div className="bg-surface-elevated border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      {displayLabel != null && (
        <div className="text-text-dim mb-0.5 font-num">{String(displayLabel)}</div>
      )}
      <div className="flex items-baseline gap-1">
        {v.name && <span className="text-text-muted">{v.name}: </span>}
        <span className="font-num font-bold text-accent tabular-nums">{v.value}</span>
        {suffix && <span className="text-text-muted">{suffix}</span>}
      </div>
    </div>
  )
}
