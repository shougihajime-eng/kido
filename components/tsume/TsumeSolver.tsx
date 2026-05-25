'use client'

import { useCallback, useMemo, useState } from 'react'
import confetti from 'canvas-confetti'
import { Lightbulb, Eye, RotateCcw, RefreshCw } from 'lucide-react'
import { TSUME, LEVEL_BADGE, parseSfen, parseUsiMove, type TsumeProblem } from '@/lib/tsume'
import { SolveBoard } from './SolveBoard'

const DROP_KANJI: Record<string, string> = {
  P: '歩',
  L: '香',
  N: '桂',
  S: '銀',
  G: '金',
  B: '角',
  R: '飛'
}

type Feedback = { kind: 'none' | 'good' | 'wrong' | 'solved'; text: string }

type Props = {
  initialIndex?: number
  /** 解かせる問題リスト（省略時は組み込みの TSUME）。DB の問題やプレビューで使う */
  problems?: TsumeProblem[]
  /** 1問だけ（「次の問題」ボタンを隠す。先生のためし解きで使う） */
  single?: boolean
}

export function TsumeSolver({ initialIndex = 0, problems, single = false }: Props) {
  const list = useMemo(
    () => (problems && problems.length > 0 ? problems : TSUME),
    [problems]
  )
  const startIndex = useMemo(
    () => initialIndex % Math.max(1, list.length),
    [initialIndex, list.length]
  )
  const [index, setIndex] = useState(startIndex)
  const [step, setStep] = useState(0)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [selectedDrop, setSelectedDrop] = useState<string | null>(null)
  const [hintIdx, setHintIdx] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [solved, setSolved] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>({ kind: 'none', text: '' })

  const item = list[index] ?? list[0]
  const boardSfen = item.frames[Math.min(step, item.frames.length - 1)]
  const lastMoveTo = step > 0 ? parseUsiMove(item.movesUsi[step - 1]).toIdx : null

  const resetProblem = useCallback((nextIndex: number) => {
    setIndex(nextIndex)
    setStep(0)
    setSelectedIdx(null)
    setSelectedDrop(null)
    setHintIdx(null)
    setBusy(false)
    setSolved(false)
    setRevealed(false)
    setFeedback({ kind: 'none', text: '' })
  }, [])

  const pickNext = useCallback(() => {
    if (list.length <= 1) return 0
    let n = Math.floor(Math.random() * list.length)
    if (n === index) n = (n + 1) % list.length
    return n
  }, [list.length, index])

  const fireConfetti = useCallback(() => {
    confetti({ particleCount: 110, spread: 70, origin: { y: 0.7 } })
  }, [])

  const attempt = useCallback(
    (toIdx: number) => {
      if (solved || busy || step >= item.tesuu) return
      const exp = parseUsiMove(item.movesUsi[step])
      let ok = false
      if (selectedDrop !== null) ok = exp.drop === selectedDrop && exp.toIdx === toIdx
      else if (selectedIdx !== null) ok = exp.fromIdx === selectedIdx && exp.toIdx === toIdx

      setSelectedIdx(null)
      setSelectedDrop(null)
      setHintIdx(null)

      if (!ok) {
        setFeedback({ kind: 'wrong', text: 'うーん、ちがうみたい。もう一回！' })
        return
      }

      const afterAttacker = step + 1
      setStep(afterAttacker)
      if (afterAttacker >= item.tesuu) {
        setSolved(true)
        setFeedback({ kind: 'solved', text: '正解！　詰み！🎉' })
        fireConfetti()
      } else {
        setFeedback({ kind: 'good', text: 'いいね！相手の受け…' })
        setBusy(true)
        setTimeout(() => {
          setStep(afterAttacker + 1)
          setBusy(false)
          setFeedback({ kind: 'none', text: '' })
        }, 750)
      }
    },
    [solved, busy, step, item, selectedDrop, selectedIdx, fireConfetti]
  )

  const handleCellClick = useCallback(
    (idx: number) => {
      if (solved || busy || step >= item.tesuu) return
      const { cells } = parseSfen(boardSfen)
      const cell = cells[idx]
      if (cell && cell.black) {
        setSelectedIdx(idx)
        setSelectedDrop(null)
        setFeedback({ kind: 'none', text: '' })
        return
      }
      if (selectedIdx !== null || selectedDrop !== null) attempt(idx)
    },
    [solved, busy, step, item.tesuu, boardSfen, selectedIdx, selectedDrop, attempt]
  )

  const handleHandClick = useCallback(
    (letter: string) => {
      if (solved || busy || step >= item.tesuu) return
      setSelectedDrop(letter)
      setSelectedIdx(null)
      setFeedback({ kind: 'none', text: '' })
    },
    [solved, busy, step, item.tesuu]
  )

  const showHint = useCallback(() => {
    if (solved || step >= item.tesuu) return
    const exp = parseUsiMove(item.movesUsi[step])
    if (exp.drop) {
      setFeedback({ kind: 'good', text: `持ち駒の「${DROP_KANJI[exp.drop] ?? exp.drop}」を使うよ` })
    } else if (exp.fromIdx !== null) {
      setHintIdx(exp.fromIdx)
      setFeedback({ kind: 'good', text: '光ったこまを動かしてみよう' })
      setTimeout(() => setHintIdx(null), 2500)
    }
  }, [solved, step, item])

  const reveal = useCallback(() => {
    setRevealed(true)
    setSolved(true)
    setStep(item.tesuu)
    setSelectedIdx(null)
    setSelectedDrop(null)
    setHintIdx(null)
    setBusy(false)
    setFeedback({ kind: 'none', text: '' })
  }, [item.tesuu])

  const badge = LEVEL_BADGE[item.level]
  const fbColor =
    feedback.kind === 'wrong'
      ? 'text-fire'
      : feedback.kind === 'solved'
        ? 'text-success'
        : 'text-accent'

  return (
    <section className="bg-surface border border-border rounded-3xl p-4 sm:p-6 flex flex-col items-center gap-3">
      {/* 見出し：手数・むずかしさ・出どころ */}
      <div className="flex flex-col items-center gap-1.5 text-center">
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent text-white font-num">
            {item.tesuu}手詰
          </span>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-mincho ${badge.bgClass} ${badge.textClass}`}
          >
            {badge.label}
          </span>
        </div>
        {item.title && <h2 className="font-mincho text-base font-semibold">{item.title}</h2>}
        {item.source && (
          <p className="text-[11px] text-text-dim font-mincho">
            出どころ：{item.source}
            {item.composer ? `（${item.composer}）` : ''}
          </p>
        )}
      </div>

      {/* 操作の案内 */}
      <p className="text-xs text-text-muted font-mincho text-center">
        あなたは <span className="font-bold text-accent">▲先手（攻め方）</span>。
        こまをタップ → 動かす先をタップ。
      </p>

      <SolveBoard
        sfen={boardSfen}
        selectedIdx={selectedIdx}
        selectedDrop={selectedDrop}
        hintIdx={hintIdx}
        lastMoveTo={lastMoveTo}
        onCellClick={handleCellClick}
        onHandClick={handleHandClick}
        disabled={solved || busy}
      />

      {/* フィードバック */}
      <div className="min-h-[1.75rem] flex items-center">
        {feedback.text ? (
          <p className={`font-mincho font-bold text-base ${fbColor}`}>{feedback.text}</p>
        ) : (
          <p className="text-xs text-text-dim font-mincho">
            {solved ? '' : `${item.tesuu}手で詰ませよう`}
          </p>
        )}
      </div>

      {/* 詰み or 答え表示：正解手順 */}
      {(solved || revealed) && (
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

      {/* ボタン */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        {!solved && (
          <button
            type="button"
            onClick={showHint}
            className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-full bg-gold-soft text-gold-deep border border-gold/40 font-mincho text-sm font-semibold active:scale-95 transition-all"
          >
            <Lightbulb className="w-4 h-4" /> ヒント
          </button>
        )}
        {!solved && (
          <button
            type="button"
            onClick={reveal}
            className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-full bg-white border border-border text-text-muted hover:text-accent hover:border-accent font-mincho text-sm active:scale-95 transition-all"
          >
            <Eye className="w-4 h-4" /> 答えを見る
          </button>
        )}
        <button
          type="button"
          onClick={() => resetProblem(index)}
          className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-full bg-white border border-border text-text-muted hover:text-accent hover:border-accent font-mincho text-sm active:scale-95 transition-all"
        >
          <RotateCcw className="w-4 h-4" /> もう一度
        </button>
        {!single && list.length > 1 && (
          <button
            type="button"
            onClick={() => resetProblem(pickNext())}
            className="inline-flex items-center gap-1.5 px-5 min-h-[44px] rounded-full bg-accent text-white font-mincho text-sm font-bold shadow-[0_4px_16px_rgba(30,64,175,0.25)] hover:bg-accent-deep active:scale-95 transition-all"
          >
            <RefreshCw className="w-4 h-4" /> 次の問題
          </button>
        )}
      </div>
    </section>
  )
}
