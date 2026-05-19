'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { categoryColorVar, getCategoryIcon } from '@/lib/category-icon'
import { parseYmd, ymdAddDays, todayLocalISO } from '@/lib/dates'

type RecordPreview = {
  id: string
  date: string
  duration_minutes: number
  memo: string | null
  recorded_at: string
  category: { name_ja: string; icon_key: string; color_token: string } | null
}

interface Props {
  startDate: string
  endDate: string
  weeks: number
  minutesByDate: Record<string, number>
  recordsByDate: Record<string, RecordPreview[]>
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

/**
 * 5段階の濃度を分から判定。
 * 0 / 1–30 / 31–60 / 61–120 / 121+
 */
function intensityLevel(minutes: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes <= 0) return 0
  if (minutes <= 30) return 1
  if (minutes <= 60) return 2
  if (minutes <= 120) return 3
  return 4
}

const LEVEL_BG = [
  'rgba(235, 229, 214, 0.5)', // 0 ベージュうすめ
  'rgba(30, 64, 175, 0.18)', // 1
  'rgba(30, 64, 175, 0.38)', // 2
  'rgba(30, 64, 175, 0.65)', // 3
  'rgba(30, 64, 175, 0.95)' // 4
]

const LEVEL_BORDER = [
  'var(--border)',
  'rgba(30, 64, 175, 0.3)',
  'rgba(30, 64, 175, 0.5)',
  'rgba(30, 64, 175, 0.7)',
  'rgba(30, 64, 175, 1)'
]

export function CalendarHeatmap({ startDate, weeks, minutesByDate, recordsByDate }: Props) {
  const today = todayLocalISO()
  const [selectedDate, setSelectedDate] = useState<string | null>(today)

  // grid: 7行（曜日）× weeks列（週）
  // start は週の頭（startDate の曜日からオフセット）に合わせる
  const grid = useMemo(() => {
    const start = parseYmd(startDate)
    const startDow = start.getDay() // 0=Sun
    // startDate を含む週の日曜から始める
    const firstCellDate = ymdAddDays(startDate, -startDow)
    const cols: { date: string; minutes: number; outOfRange: boolean }[][] = []
    for (let w = 0; w < weeks + 1; w++) {
      const colDates: { date: string; minutes: number; outOfRange: boolean }[] = []
      for (let d = 0; d < 7; d++) {
        const date = ymdAddDays(firstCellDate, w * 7 + d)
        const outOfRange = date < startDate || date > today
        colDates.push({
          date,
          minutes: minutesByDate[date] ?? 0,
          outOfRange
        })
      }
      cols.push(colDates)
    }
    return cols
  }, [startDate, weeks, minutesByDate, today])

  // 月ラベル：各列の最初の日（日曜）の月が前と変わったらラベル
  const monthLabels = useMemo(() => {
    const labels: { col: number; label: string }[] = []
    let prevMonth = -1
    grid.forEach((col, i) => {
      const firstNonOutOfRange = col.find((c) => !c.outOfRange) ?? col[0]
      const m = parseYmd(firstNonOutOfRange.date).getMonth() + 1
      if (m !== prevMonth && !firstNonOutOfRange.outOfRange) {
        labels.push({ col: i, label: `${m}月` })
        prevMonth = m
      }
    })
    return labels
  }, [grid])

  const selectedRecords = selectedDate ? recordsByDate[selectedDate] ?? [] : []
  const selectedMinutes = selectedDate ? minutesByDate[selectedDate] ?? 0 : 0

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface border border-border rounded-2xl p-4 overflow-x-auto">
        {/* 月ラベル */}
        <div className="flex pl-7 mb-1 text-[10px] text-text-dim font-num">
          {grid.map((_, i) => {
            const m = monthLabels.find((l) => l.col === i)
            return (
              <div key={i} className="w-[14px] flex-shrink-0">
                {m?.label ?? ''}
              </div>
            )
          })}
        </div>

        <div className="flex gap-1">
          {/* 曜日ラベル */}
          <div className="flex flex-col gap-1 mr-1 text-[10px] text-text-dim font-num pt-0.5">
            {WEEKDAY_LABELS.map((d, i) => (
              <div key={d} className="h-3 flex items-center" aria-hidden>
                {i % 2 === 1 ? d : ''}
              </div>
            ))}
          </div>

          {/* セルグリッド */}
          {grid.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-1">
              {col.map((cell) => {
                if (cell.outOfRange) {
                  return <div key={cell.date} className="h-4 w-4" />
                }
                const level = intensityLevel(cell.minutes)
                const isSelected = selectedDate === cell.date
                const isToday = cell.date === today
                return (
                  <motion.button
                    key={cell.date}
                    type="button"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.3,
                      delay: 0.0015 * (ci * 7 + col.indexOf(cell)),
                      ease: [0.16, 1, 0.3, 1]
                    }}
                    whileHover={{ scale: 1.4 }}
                    onClick={() => setSelectedDate(cell.date)}
                    aria-label={`${cell.date}: ${cell.minutes}分`}
                    className="h-4 w-4 rounded-[4px] border transition-all"
                    style={{
                      backgroundColor: LEVEL_BG[level],
                      borderColor: isSelected
                        ? 'var(--accent)'
                        : isToday
                          ? 'var(--accent)'
                          : LEVEL_BORDER[level],
                      borderWidth: isSelected || isToday ? '1.5px' : '1px',
                      boxShadow: isSelected ? '0 0 8px rgba(30, 64, 175, 0.5)' : undefined
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>

        {/* 凡例 */}
        <div className="flex items-center gap-2 mt-3 text-[10px] text-text-dim font-num">
          <span>少ない</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <span
              key={l}
              className="h-4 w-4 rounded-[4px] border"
              style={{
                backgroundColor: LEVEL_BG[l],
                borderColor: LEVEL_BORDER[l]
              }}
            />
          ))}
          <span>多い</span>
        </div>
      </div>

      {/* 選択された日の詳細 */}
      {selectedDate && (
        <motion.div
          key={selectedDate}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3"
        >
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm text-text-muted">
              {formatDateLabel(selectedDate)}
              {selectedDate === today && (
                <span className="ml-2 text-xs text-accent font-num">TODAY</span>
              )}
            </h2>
            <div className="flex items-baseline gap-1">
              <span className="font-num text-2xl font-bold tabular-nums gold-glow">
                {selectedMinutes}
              </span>
              <span className="text-xs text-text-muted">分</span>
            </div>
          </div>

          {selectedRecords.length === 0 ? (
            <p className="text-xs text-text-dim text-center py-3">この日の記録はまだありません</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {selectedRecords.map((r) => {
                const Icon = getCategoryIcon(r.category?.icon_key ?? 'plus')
                const color = categoryColorVar(r.category?.color_token ?? 'cat-other')
                return (
                  <li key={r.id} className="flex items-center gap-3">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0"
                      style={{ backgroundColor: color + '22', color }}
                    >
                      <Icon className="h-4 w-4" strokeWidth={2.2} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {r.category?.name_ja ?? '—'}
                      </div>
                      {r.memo && (
                        <div className="text-xs text-text-muted truncate">{r.memo}</div>
                      )}
                    </div>
                    <div className="flex items-baseline gap-0.5 flex-shrink-0">
                      <span className="font-num font-bold tabular-nums">{r.duration_minutes}</span>
                      <span className="text-xs text-text-muted">分</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </motion.div>
      )}
    </div>
  )
}

function formatDateLabel(iso: string): string {
  const d = parseYmd(iso)
  const m = d.getMonth() + 1
  const day = d.getDate()
  const dow = WEEKDAY_LABELS[d.getDay()]
  return `${m}/${day}（${dow}）`
}
