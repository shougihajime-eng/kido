'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { RefreshCw, ChevronRight } from 'lucide-react'
import { MEIGEN, SOURCE_BADGE, pickNextMeigen } from '@/lib/meigen'

type Props = {
  // 初期表示の名言インデックス（サーバ側で日付シードから決定するため、SSR/CSRで同じになる）
  initialIndex?: number
  // 「もっと見る」リンクの遷移先（既定 /meigen）
  moreHref?: string
  // 軽量モード：朱印・出典バッジを省略し、密度を上げる（家族用ダッシュボードなど）
  compact?: boolean
}

export function MeigenCard({ initialIndex, moreHref = '/meigen', compact = false }: Props) {
  // initialIndex 未指定なら 0 から始める（呼び出し側はサーバから決定論的値を渡す想定）
  const startIndex = useMemo(() => initialIndex ?? 0, [initialIndex])
  const [index, setIndex] = useState<number>(startIndex)
  // 再描画キー：更新ボタン押下時にアニメをやり直すのに使う
  const [animKey, setAnimKey] = useState<number>(0)

  const handleNext = useCallback(() => {
    setIndex((prev) => pickNextMeigen(prev))
    setAnimKey((k) => k + 1)
  }, [])

  const item = MEIGEN[index] ?? MEIGEN[0]
  const badge = SOURCE_BADGE[item.source]

  return (
    <section
      className={`washi-paper rounded-3xl p-5 sm:p-7 md:p-8 flex flex-col gap-4 sm:gap-5 relative ${
        compact ? '' : 'min-h-[200px] sm:min-h-[260px]'
      }`}
      aria-label="名言の間"
    >
      {/* 上部：朱印 + バッジ */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {!compact && (
            <span className="shuin" aria-hidden="true">
              名言
            </span>
          )}
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badge.bgClass} ${badge.textClass} font-mincho`}
          >
            {badge.label}
          </span>
        </div>
        <Link
          href={moreHref}
          className="text-xs text-text-dim hover:text-accent font-mincho inline-flex items-center gap-0.5 transition-colors"
          aria-label="名言一覧をみる"
        >
          一覧
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 名言本文（筆文字） */}
      <div
        key={animKey}
        className="ink-bloom flex-1 flex flex-col justify-center gap-3 sm:gap-4 py-2"
      >
        <p
          className="font-fude text-[1.7rem] sm:text-[2rem] md:text-[2.35rem] leading-snug tracking-wide text-center px-1"
          // 改行を尊重しつつ、和文の禁則を効かせる
          style={{ wordBreak: 'normal', overflowWrap: 'break-word' }}
        >
          {item.text}
        </p>
        <p className="text-center font-mincho text-sm sm:text-base text-text-muted">
          ― {item.author}
        </p>
      </div>

      {/* 更新ボタン：押すたびに新しい名言（無限ループ） */}
      <button
        type="button"
        onClick={handleNext}
        className="self-center inline-flex items-center justify-center gap-2 px-5 sm:px-6 min-h-[48px] rounded-full bg-white/70 hover:bg-white border border-gold/40 hover:border-gold text-gold-deep font-mincho font-semibold text-sm sm:text-base shadow-sm active:scale-95 transition-all"
        aria-label="次の名言にかえる"
      >
        <RefreshCw className="w-4 h-4" />
        次の名言
      </button>
    </section>
  )
}
