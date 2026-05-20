'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronUp, RefreshCw } from 'lucide-react'
import {
  ALL_THEMES,
  MEIGEN,
  SOURCE_BADGE,
  THEME_LABEL,
  type MeigenSource,
  type ThemeTag
} from '@/lib/meigen'
import { MeigenScrollModal } from './MeigenScrollModal'

type SourceFilter = 'all' | MeigenSource
type ThemeFilter = 'all' | ThemeTag

const SOURCE_FILTERS: { value: SourceFilter; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'shogi', label: '棋士の言葉' },
  { value: 'kakugen', label: '将棋格言' },
  { value: 'life', label: '全力の名言' }
]

// 履歴の保持上限（古いものから捨てる）。「ひとつ前」ボタン用。
const HISTORY_MAX = 60

// 直前と同じインデックスを避けてランダムに選ぶ
function pickRandomDifferent(len: number, exclude: number | undefined): number {
  if (len <= 0) return 0
  if (len === 1) return 0
  let next = Math.floor(Math.random() * len)
  if (next === exclude) next = (next + 1) % len
  return next
}

type Props = {
  // ページ初期表示時に出す名言（MEIGEN 配列上の index）。
  // サーバー側で日付シードから決定 → SSR/CSR でズレない初期描画になる
  initialIndex?: number
}

export function MeigenList({ initialIndex = 0 }: Props) {
  // フィルタ
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [themeFilter, setThemeFilter] = useState<ThemeFilter>('all')
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false)
  // 一覧グリッド（畳んでおく。押したら展開）
  const [showGrid, setShowGrid] = useState<boolean>(false)
  // 掛け軸モーダル（一覧から開く時に使う）
  const [modalIdx, setModalIdx] = useState<number | null>(null)

  // フィルタを適用したリスト
  const filtered = useMemo(() => {
    return MEIGEN.filter((m) => {
      if (sourceFilter !== 'all' && m.source !== sourceFilter) return false
      if (themeFilter !== 'all') {
        if (!m.themes || !m.themes.includes(themeFilter)) return false
      }
      return true
    })
  }, [sourceFilter, themeFilter])

  // 履歴：閲覧した「フィルタ後リスト上の index」を時系列に保持
  // 初期値：initialIndex（MEIGEN 全体での index）が、フィルタ後リストに含まれていれば
  // その位置を使う。そうでなければ 0（フィルタ後の先頭）。
  const computeInitialFilteredIndex = useCallback(() => {
    if (filtered.length === 0) return 0
    const initialItem = MEIGEN[initialIndex]
    if (initialItem) {
      const inFiltered = filtered.indexOf(initialItem)
      if (inFiltered >= 0) return inFiltered
    }
    return 0
  }, [filtered, initialIndex])

  const [history, setHistory] = useState<number[]>(() => [computeInitialFilteredIndex()])
  // ink-bloom 再生用：演出をやり直したい瞬間にカウントを上げる
  const [animKey, setAnimKey] = useState<number>(0)

  // 初回マウントを区別して、フィルタ変更時だけ履歴を新しいランダムで作り直す
  const isInitialMount = useRef<boolean>(true)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (filtered.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHistory([])
    } else {
      setHistory([pickRandomDifferent(filtered.length, undefined)])
    }
    setAnimKey((k) => k + 1)
  }, [filtered])

  const currentIdx = history[history.length - 1] ?? 0
  const item = filtered[currentIdx]

  const goNext = useCallback(() => {
    if (filtered.length === 0) return
    const next = pickRandomDifferent(filtered.length, currentIdx)
    setHistory((h) => {
      const newH = [...h, next]
      return newH.length > HISTORY_MAX ? newH.slice(-HISTORY_MAX) : newH
    })
    setAnimKey((k) => k + 1)
  }, [filtered.length, currentIdx])

  const goPrev = useCallback(() => {
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h))
    setAnimKey((k) => k + 1)
  }, [])

  const canGoPrev = history.length > 1

  // 一覧モード用：モーダルを開く・前後送り・閉じる
  const openModal = useCallback((idx: number) => setModalIdx(idx), [])
  const closeModal = useCallback(() => setModalIdx(null), [])
  const modalNext = useCallback(() => {
    setModalIdx((c) => (c === null ? null : (c + 1) % filtered.length))
  }, [filtered.length])
  const modalPrev = useCallback(() => {
    setModalIdx((c) => (c === null ? null : (c - 1 + filtered.length) % filtered.length))
  }, [filtered.length])

  // フィルタが効いているかどうか（UIヒント用）
  const activeFilterCount =
    (sourceFilter !== 'all' ? 1 : 0) + (themeFilter !== 'all' ? 1 : 0)

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* キモチ/出典フィルタ（折りたたみ式で控えめ） */}
        <section className="bg-surface/70 backdrop-blur rounded-2xl border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-sm font-mincho hover:bg-surface-overlay transition-colors"
          >
            <span className="flex items-center gap-2 text-text-muted">
              キモチや出典で絞る
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-gold-soft text-gold-deep text-[10px] font-num font-bold">
                  {activeFilterCount}
                </span>
              )}
            </span>
            {filtersOpen ? (
              <ChevronUp className="w-4 h-4 text-text-dim" />
            ) : (
              <ChevronDown className="w-4 h-4 text-text-dim" />
            )}
          </button>

          {filtersOpen && (
            <div className="px-3.5 sm:px-4 pb-4 flex flex-col gap-3 border-t border-border">
              <div className="flex flex-col gap-2 pt-3">
                <h3 className="text-xs font-mincho text-text-muted">今のキモチ</h3>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setThemeFilter('all')}
                    className={`px-3 py-1.5 min-h-[36px] rounded-full text-xs font-medium font-mincho transition-colors ${
                      themeFilter === 'all'
                        ? 'bg-gold text-white'
                        : 'bg-white border border-border text-text-muted hover:border-gold hover:text-gold-deep'
                    }`}
                  >
                    指定なし
                  </button>
                  {ALL_THEMES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setThemeFilter(t)}
                      className={`px-3 py-1.5 min-h-[36px] rounded-full text-xs font-medium font-mincho transition-colors ${
                        themeFilter === t
                          ? 'bg-gold text-white'
                          : 'bg-white border border-border text-text-muted hover:border-gold hover:text-gold-deep'
                      }`}
                    >
                      {THEME_LABEL[t]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-mincho text-text-muted">出典</h3>
                <div className="flex flex-wrap gap-1.5">
                  {SOURCE_FILTERS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setSourceFilter(f.value)}
                      className={`px-3 py-1.5 min-h-[36px] rounded-full text-xs font-medium font-mincho transition-colors ${
                        sourceFilter === f.value
                          ? 'bg-accent text-white'
                          : 'bg-white border border-border text-text-muted hover:border-accent hover:text-accent'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 大きな名言カード（メインの主役） */}
        {!item ? (
          <div className="washi-paper rounded-3xl p-10 text-center font-mincho text-text-muted">
            条件に合う名言がありません。フィルタを見直してください。
          </div>
        ) : (
          <div className="washi-paper rounded-3xl p-6 sm:p-10 md:p-14 flex flex-col items-center text-center min-h-[300px] sm:min-h-[400px] justify-center gap-4 relative">
            <div
              key={animKey}
              className="ink-bloom flex flex-col items-center gap-4 sm:gap-5 w-full"
            >
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium font-mincho ${SOURCE_BADGE[item.source].bgClass} ${SOURCE_BADGE[item.source].textClass}`}
                >
                  {SOURCE_BADGE[item.source].label}
                </span>
                {item.themes?.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium font-mincho bg-gold-soft text-gold-deep"
                  >
                    {THEME_LABEL[t]}
                  </span>
                ))}
              </div>
              <p className="font-fude text-[1.85rem] sm:text-[2.4rem] md:text-[3rem] leading-snug tracking-wide my-2 sm:my-3 px-1">
                {item.text}
              </p>
              <p className="font-mincho text-sm sm:text-base text-text-muted">
                ― {item.author}
              </p>
            </div>
          </div>
        )}

        {/* どっしり大きい「次の名言」ボタン（主役の動詞） */}
        {item && (
          <button
            type="button"
            onClick={goNext}
            className="w-full min-h-[76px] sm:min-h-[88px] rounded-3xl bg-accent text-white font-mincho font-bold text-xl sm:text-2xl shadow-[0_8px_28px_rgba(30,64,175,0.3)] hover:bg-accent-deep active:scale-[0.99] transition-all inline-flex items-center justify-center gap-3"
          >
            <RefreshCw className="w-6 h-6 sm:w-7 sm:h-7" />
            次の名言
          </button>
        )}

        {/* ひとつ前にもどる（履歴があるときだけ表示） */}
        {canGoPrev && (
          <button
            type="button"
            onClick={goPrev}
            className="self-center inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-full bg-surface border border-border text-text-muted hover:text-accent hover:border-accent transition-colors text-sm font-mincho"
          >
            <ChevronLeft className="w-4 h-4" />
            ひとつ前の名言にもどる
          </button>
        )}

        <div className="text-center font-mincho text-xs text-text-dim">
          全 <span className="font-num font-bold text-accent">{filtered.length}</span> 句
          {activeFilterCount > 0 && '（絞り込み中）'}
        </div>

        {/* 一覧で見るトグル（オフ → オンで下に一覧が出る） */}
        <button
          type="button"
          onClick={() => setShowGrid((s) => !s)}
          className="self-center inline-flex items-center gap-1.5 mt-2 px-5 py-3 min-h-[48px] rounded-full bg-surface border border-border text-text-muted hover:text-accent hover:border-accent transition-colors text-sm font-mincho"
        >
          {showGrid ? (
            <>
              一覧をしまう
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              一覧でまとめて見たい
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>

        {/* 一覧（色紙風カード・タップで掛け軸モーダルが開く） */}
        {showGrid && (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
            {filtered.map((m, i) => {
              const badge = SOURCE_BADGE[m.source]
              const tilt = i % 2 === 0 ? '0.6deg' : '-0.6deg'
              return (
                <li key={`${m.author}-${i}`}>
                  <button
                    type="button"
                    onClick={() => openModal(i)}
                    className="shikishi-card washi-paper rounded-2xl p-5 sm:p-6 flex flex-col gap-3 w-full text-left cursor-pointer hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                    style={{ ['--tilt' as string]: tilt }}
                    aria-label={`「${m.text}」を掛け軸で開く`}
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
                    <p className="font-fude text-[1.25rem] sm:text-[1.4rem] leading-snug tracking-wide">
                      {m.text}
                    </p>
                    <p className="font-mincho text-xs sm:text-sm text-text-muted self-end">
                      ― {m.author}
                    </p>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* 一覧から開いた掛け軸モーダル */}
      {modalIdx !== null && filtered[modalIdx] && (
        <MeigenScrollModal
          item={filtered[modalIdx]}
          index={modalIdx}
          total={filtered.length}
          onClose={closeModal}
          onPrev={modalPrev}
          onNext={modalNext}
        />
      )}
    </>
  )
}
