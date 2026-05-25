'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, RefreshCw, ChevronRight } from 'lucide-react'
import { TSUME, LEVEL_BADGE, type TsumeProblem } from '@/lib/tsume'
import { ShogiBoard } from './ShogiBoard'

type Props = {
  /** 初期表示する問題（サーバ側で日付シードから決定） */
  initialIndex?: number
  /** ダッシュボード用のコンパクト表示 */
  compact?: boolean
  /** 表示する問題リスト（省略時は組み込みの TSUME）。DB の公開問題で使う */
  problems?: TsumeProblem[]
}

export function TsumeViewer({ initialIndex = 0, compact = false, problems }: Props) {
  const list = useMemo(
    () => (problems && problems.length > 0 ? problems : TSUME),
    [problems]
  )
  const start = useMemo(() => initialIndex % Math.max(1, list.length), [initialIndex, list.length])
  const [index, setIndex] = useState<number>(start)
  const [showAnswer, setShowAnswer] = useState<boolean>(false)

  const item = list[index] ?? list[0]
  const badge = LEVEL_BADGE[item.level]

  const handleNext = useCallback(() => {
    setIndex((prev) => {
      if (list.length <= 1) return 0
      let n = Math.floor(Math.random() * list.length)
      if (n === prev) n = (n + 1) % list.length
      return n
    })
    setShowAnswer(false)
  }, [list.length])

  const toggleAnswer = useCallback(() => setShowAnswer((v) => !v), [])

  if (!item) return null

  return (
    <section
      className="bg-surface border border-border rounded-3xl p-5 sm:p-7 flex flex-col items-center gap-4"
      aria-label="今日の詰将棋"
    >
      {/* 見出し：手数・むずかしさ・出典 */}
      <div className="flex flex-col items-center gap-1.5 text-center">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent text-white font-num">
            {item.tesuu}手詰
          </span>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-mincho ${badge.bgClass} ${badge.textClass}`}
          >
            {badge.label}
          </span>
        </div>
        {item.title && <h2 className="font-mincho text-base sm:text-lg font-semibold">{item.title}</h2>}
        {(item.composer || item.source) && (
          <p className="text-xs text-text-dim font-mincho">
            {item.source}
            {item.composer ? `　${item.composer}` : ''}
          </p>
        )}
        <p className="text-[11px] text-text-dim">先手（▲）が攻め方。下から上へ詰ます。</p>
      </div>

      {/* 盤：答えを見ると詰み上がりに切り替わる */}
      <ShogiBoard sfen={showAnswer ? item.finalSfen : item.startSfen} />

      {/* 答えを見るトグル（フルページのみ。ダッシュボードでは答えを隠す） */}
      {!compact && (
        <button
          type="button"
          onClick={toggleAnswer}
          className="inline-flex items-center justify-center gap-2 px-5 min-h-[48px] rounded-full bg-white/70 hover:bg-white border border-accent/40 hover:border-accent text-accent font-mincho font-semibold text-sm active:scale-95 transition-all"
        >
          {showAnswer ? (
            <>
              <EyeOff className="w-4 h-4" /> 問題にもどす
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" /> 答えを見る
            </>
          )}
        </button>
      )}

      {/* 答え（手順＋解説） */}
      {!compact && showAnswer && (
        <div className="w-full max-w-sm flex flex-col gap-2 bg-accent-soft/50 rounded-2xl p-4">
          <div className="text-xs text-text-muted font-mincho">正解の手順</div>
          <ol className="flex flex-wrap gap-x-3 gap-y-1 font-num text-base font-semibold text-accent-deep">
            {item.movesJa.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ol>
          {item.note && (
            <p className="text-sm text-text-muted font-mincho leading-relaxed mt-1">{item.note}</p>
          )}
        </div>
      )}

      {/* 次の問題（フルページのみ）/ 解いてみる（コンパクト） */}
      {compact ? (
        <Link
          href="/tsume"
          className="inline-flex items-center justify-center gap-1.5 px-6 min-h-[48px] rounded-full bg-accent text-white font-mincho font-bold text-sm shadow-[0_4px_16px_rgba(30,64,175,0.25)] hover:bg-accent-deep active:scale-95 transition-all"
        >
          指で解いてみる
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <button
          type="button"
          onClick={handleNext}
          className="self-center inline-flex items-center justify-center gap-2 px-6 min-h-[52px] rounded-full bg-accent text-white font-mincho font-bold text-base shadow-[0_6px_20px_rgba(30,64,175,0.25)] hover:bg-accent-deep active:scale-95 transition-all"
        >
          <RefreshCw className="w-5 h-5" />
          次の問題
        </button>
      )}
    </section>
  )
}
