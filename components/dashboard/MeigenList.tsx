'use client'

import { useState, useMemo } from 'react'
import {
  MEIGEN,
  SOURCE_BADGE,
  ALL_THEMES,
  THEME_LABEL,
  type MeigenSource,
  type ThemeTag
} from '@/lib/meigen'

type SourceFilter = 'all' | MeigenSource
type ThemeFilter = 'all' | ThemeTag

const SOURCE_FILTERS: { value: SourceFilter; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'shogi', label: '棋士の言葉' },
  { value: 'kakugen', label: '将棋格言' },
  { value: 'life', label: '全力の名言' }
]

export function MeigenList() {
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [themeFilter, setThemeFilter] = useState<ThemeFilter>('all')

  const filtered = useMemo(() => {
    return MEIGEN.filter((m) => {
      if (sourceFilter !== 'all' && m.source !== sourceFilter) return false
      if (themeFilter !== 'all') {
        if (!m.themes || !m.themes.includes(themeFilter)) return false
      }
      return true
    })
  }, [sourceFilter, themeFilter])

  return (
    <div className="flex flex-col gap-5">
      {/* 「今のキモチで選ぶ」テーマフィルタ */}
      <section className="flex flex-col gap-2.5">
        <h2 className="text-sm font-mincho text-text-muted">今のキモチで選ぶ</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setThemeFilter('all')}
            className={`px-3.5 py-2 min-h-[40px] rounded-full text-sm font-medium font-mincho transition-all ${
              themeFilter === 'all'
                ? 'bg-gold text-white shadow-md'
                : 'bg-surface border border-border text-text-muted hover:border-gold hover:text-gold-deep'
            }`}
          >
            キモチで絞らない
          </button>
          {ALL_THEMES.map((theme) => {
            const active = themeFilter === theme
            return (
              <button
                key={theme}
                type="button"
                onClick={() => setThemeFilter(theme)}
                className={`px-3.5 py-2 min-h-[40px] rounded-full text-sm font-medium font-mincho transition-all ${
                  active
                    ? 'bg-gold text-white shadow-md'
                    : 'bg-surface border border-border text-text-muted hover:border-gold hover:text-gold-deep'
                }`}
              >
                {THEME_LABEL[theme]}
              </button>
            )
          })}
        </div>
      </section>

      {/* 出典フィルタ */}
      <section className="flex flex-col gap-2.5">
        <h2 className="text-sm font-mincho text-text-muted">出典で絞る</h2>
        <div className="flex flex-wrap gap-2">
          {SOURCE_FILTERS.map((f) => {
            const active = sourceFilter === f.value
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setSourceFilter(f.value)}
                className={`px-3.5 py-2 min-h-[40px] rounded-full text-sm font-medium font-mincho transition-all ${
                  active
                    ? 'bg-accent text-white shadow-md'
                    : 'bg-surface border border-border text-text-muted hover:border-accent hover:text-accent'
                }`}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </section>

      <div className="text-xs text-text-dim font-mincho">
        全 <span className="font-num font-bold text-accent">{filtered.length}</span> 句
        {filtered.length === 0 && '（条件に合う名言がありません）'}
      </div>

      {/* 一覧：PC は 2 カラム、スマホは 1 カラム */}
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((m, i) => {
          const badge = SOURCE_BADGE[m.source]
          return (
            <li
              key={`${m.author}-${i}`}
              className="washi-paper rounded-2xl p-5 sm:p-6 flex flex-col gap-3"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium font-mincho ${badge.bgClass} ${badge.textClass}`}
                >
                  {badge.label}
                </span>
                {m.themes?.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium font-mincho bg-gold-soft text-gold-deep"
                  >
                    {THEME_LABEL[t]}
                  </span>
                ))}
              </div>
              <p className="font-fude text-[#2b2b2b] text-[1.15rem] sm:text-[1.3rem] leading-snug tracking-wide">
                {m.text}
              </p>
              <p className="font-mincho text-xs sm:text-sm text-text-muted self-end">
                ― {m.author}
              </p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
