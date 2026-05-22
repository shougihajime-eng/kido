'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { categoryColorVar, getCategoryIcon } from '@/lib/category-icon'
import { parseYmd, ymdAddDays, todayLocalISO } from '@/lib/dates'
import { DayCommentThread } from '@/components/comments/DayCommentThread'
import type { DayCommentItemView } from '@/lib/day-comments'

type RecordPreview = {
  id: string
  date: string
  duration_minutes: number
  memo: string | null
  recorded_at: string
  category: { name_ja: string; icon_key: string; color_token: string } | null
}

type EventPreview = { title: string; emoji: string }

interface Props {
  startDate: string
  endDate: string
  weeks: number
  minutesByDate: Record<string, number>
  recordsByDate: Record<string, RecordPreview[]>
  eventsByDate?: Record<string, EventPreview[]>
  /** カレンダーの主（生徒）の user_id。日コメントを書き込む対象。 */
  studentId?: string
  /** 日付 → コメント配列。指定された日のスレッドだけ表示。 */
  dayCommentsByDate?: Record<string, DayCommentItemView[]>
  /** コメント書き込み可能か（生徒・親・先生・スーパー先生は true） */
  canPostDayComment?: boolean
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

export function CalendarHeatmap({
  startDate,
  weeks,
  minutesByDate,
  recordsByDate,
  eventsByDate,
  studentId,
  dayCommentsByDate,
  canPostDayComment
}: Props) {
  const today = todayLocalISO()
  const [selectedDate, setSelectedDate] = useState<string | null>(today)

  // grid: 7行（曜日）× weeks列（週）
  // start は週の頭（startDate の曜日からオフセット）に合わせる
  // 予定（イベント）は過去〜未来含む全期間表示するため、最大未来日まで grid を拡張
  const futureEventDates = useMemo(() => {
    if (!eventsByDate) return [] as string[]
    return Object.keys(eventsByDate).filter((d) => d > today).sort()
  }, [eventsByDate, today])
  const maxFutureDate = futureEventDates.length > 0 ? futureEventDates[futureEventDates.length - 1] : today

  const grid = useMemo(() => {
    const start = parseYmd(startDate)
    const startDow = start.getDay() // 0=Sun
    // startDate を含む週の日曜から始める
    const firstCellDate = ymdAddDays(startDate, -startDow)
    // future 予定日まで含むよう週数を拡張
    let extraWeeks = 0
    if (maxFutureDate > today) {
      const diffDays = Math.ceil(
        (parseYmd(maxFutureDate).getTime() - parseYmd(today).getTime()) / (1000 * 60 * 60 * 24)
      )
      extraWeeks = Math.ceil(diffDays / 7)
    }
    const totalWeeks = weeks + 1 + extraWeeks
    const cols: { date: string; minutes: number; outOfRange: boolean; isFuture: boolean }[][] = []
    for (let w = 0; w < totalWeeks; w++) {
      const colDates: { date: string; minutes: number; outOfRange: boolean; isFuture: boolean }[] = []
      for (let d = 0; d < 7; d++) {
        const date = ymdAddDays(firstCellDate, w * 7 + d)
        const outOfRange = date < startDate || (date > today && !(eventsByDate?.[date]?.length))
        const isFuture = date > today
        colDates.push({
          date,
          minutes: minutesByDate[date] ?? 0,
          outOfRange,
          isFuture
        })
      }
      cols.push(colDates)
    }
    return cols
  }, [startDate, weeks, minutesByDate, today, maxFutureDate, eventsByDate])

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
  const selectedEvents = selectedDate ? eventsByDate?.[selectedDate] ?? [] : []
  const selectedIsFuture = selectedDate ? selectedDate > today : false

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
                const events = eventsByDate?.[cell.date] ?? []
                const hasEvent = events.length > 0
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
                    whileTap={{ scale: 1.3 }}
                    onClick={() => setSelectedDate(cell.date)}
                    aria-label={`${cell.date}: ${cell.minutes}分${hasEvent ? ` 予定:${events.map((e) => e.title).join('、')}` : ''}`}
                    className="relative h-4 w-4 rounded-[4px] border transition-all"
                    style={{
                      backgroundColor: cell.isFuture ? 'transparent' : LEVEL_BG[level],
                      borderColor: isSelected
                        ? 'var(--accent)'
                        : isToday
                          ? 'var(--accent)'
                          : hasEvent
                            ? 'var(--fire)'
                            : cell.isFuture
                              ? 'var(--border)'
                              : LEVEL_BORDER[level],
                      borderWidth: isSelected || isToday || hasEvent ? '1.5px' : '1px',
                      borderStyle: cell.isFuture && !hasEvent ? 'dashed' : 'solid',
                      boxShadow: isSelected ? '0 0 8px rgba(30, 64, 175, 0.5)' : hasEvent ? '0 0 6px rgba(216, 75, 78, 0.5)' : undefined
                    }}
                  >
                    {hasEvent && (
                      <span className="absolute -top-1.5 -right-1.5 text-[10px] leading-none">
                        {events[0].emoji}
                      </span>
                    )}
                  </motion.button>
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

          {/* 予定（イベント） */}
          {selectedEvents.length > 0 && (
            <div className="bg-fire/10 border border-fire/30 rounded-xl p-3 flex flex-col gap-1.5">
              <div className="text-[10px] font-bold text-fire uppercase tracking-wider">予定</div>
              {selectedEvents.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-base">{e.emoji}</span>
                  <span className="font-semibold">{e.title}</span>
                </div>
              ))}
            </div>
          )}

          {selectedIsFuture ? (
            selectedEvents.length === 0 ? (
              <a
                href="/countdowns"
                className="block text-center py-3 text-xs text-accent hover:underline"
              >
                + この日の予定を追加する
              </a>
            ) : null
          ) : selectedRecords.length === 0 ? (
            <p className="text-xs text-text-dim text-center py-2">この日の記録はまだありません</p>
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

          {/* 日コメント（記録がなくても書ける） */}
          {studentId && !selectedIsFuture && (
            <div className="border-t border-border pt-3">
              <DayCommentThread
                studentId={studentId}
                date={selectedDate}
                comments={dayCommentsByDate?.[selectedDate] ?? []}
                canPost={canPostDayComment ?? false}
              />
            </div>
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
