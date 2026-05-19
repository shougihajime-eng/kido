'use client'

import { useEffect, useRef, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { SOURCE_BADGE, THEME_LABEL, type Meigen } from '@/lib/meigen'

type Props = {
  item: Meigen
  index: number
  total: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export function MeigenScrollModal({ item, index, total, onClose, onPrev, onNext }: Props) {
  const touchStartX = useRef<number | null>(null)
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)

  // キーボード操作（ESC / ← →）と body スクロールロック
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') onNext()
      else if (e.key === 'ArrowLeft') onPrev()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // 開いた瞬間、閉じるボタンにフォーカス（キーボード操作で迷子にならないように）
    closeBtnRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, onNext, onPrev])

  // スマホでのスワイプ送り
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null) return
      const diff = e.changedTouches[0].clientX - touchStartX.current
      touchStartX.current = null
      if (Math.abs(diff) > 60) {
        if (diff > 0) onPrev()
        else onNext()
      }
    },
    [onNext, onPrev]
  )

  const badge = SOURCE_BADGE[item.source]

  return (
    <div
      className="meigen-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="名言を味わう"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 閉じるボタン（右上） */}
      <button
        ref={closeBtnRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        aria-label="閉じる"
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 w-11 h-11 rounded-full bg-white/70 hover:bg-white border border-gold/30 flex items-center justify-center text-gold-deep shadow-sm active:scale-95 transition-all"
      >
        <X className="w-5 h-5" />
      </button>

      {/* 前へ（PC：左端の大きいボタン） */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onPrev()
        }}
        aria-label="前の名言"
        className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/70 hover:bg-white border border-gold/30 items-center justify-center text-gold-deep shadow-sm active:scale-95 transition-all"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      {/* 次へ（PC：右端の大きいボタン） */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onNext()
        }}
        aria-label="次の名言"
        className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/70 hover:bg-white border border-gold/30 items-center justify-center text-gold-deep shadow-sm active:scale-95 transition-all"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* 掛け軸本体 */}
      <div
        className="meigen-scroll"
        onClick={(e) => e.stopPropagation()}
        // 中身を切り替えるたびに再アニメ
        key={`${index}-${item.text}`}
      >
        {/* バッジ群 */}
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium font-mincho ${badge.bgClass} ${badge.textClass}`}
          >
            {badge.label}
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

        {/* 大筆の本文 */}
        <div className="meigen-scroll-inner flex-1 flex items-center justify-center py-4">
          <p className="meigen-scroll-text">{item.text}</p>
        </div>

        {/* 出典 */}
        <p className="text-center font-mincho text-sm sm:text-base text-text-muted">
          ― {item.author}
        </p>

        {/* スマホ用：前へ/次へ + ページ表示 */}
        <div className="flex items-center justify-between gap-3 pt-2 md:hidden">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onPrev()
            }}
            aria-label="前の名言"
            className="inline-flex items-center gap-1 px-3 py-2 min-h-[44px] rounded-full bg-white/80 border border-gold/30 text-gold-deep font-mincho text-sm active:scale-95 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            前へ
          </button>
          <span className="font-mincho text-xs text-text-dim">
            <span className="font-num">{index + 1}</span> / <span className="font-num">{total}</span>
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onNext()
            }}
            aria-label="次の名言"
            className="inline-flex items-center gap-1 px-3 py-2 min-h-[44px] rounded-full bg-white/80 border border-gold/30 text-gold-deep font-mincho text-sm active:scale-95 transition"
          >
            次へ
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* PC用：ページ番号と閉じるヒント */}
        <div className="hidden md:flex items-center justify-center gap-3 pt-1 font-mincho text-xs text-text-dim">
          <span>
            <span className="font-num">{index + 1}</span> / <span className="font-num">{total}</span>
          </span>
          <span className="opacity-60">・ ESCで閉じる ・ ←→ で前後</span>
        </div>
      </div>
    </div>
  )
}
