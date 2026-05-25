'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Eraser,
  Undo2,
  RotateCcw,
  Play,
  Pencil,
  Save,
  Eye,
  Loader2,
  Sparkles,
  Keyboard,
  LayoutGrid
} from 'lucide-react'
import {
  emptyPosition,
  parseSfenFull,
  positionToSfen,
  buildFrames,
  promotionState,
  idxToUsiSquare,
  type Position
} from '@/lib/shogi-move'
import { parseUsiMove, type TsumeProblem, type TsumeLevel } from '@/lib/tsume'
import { EditBoard } from './EditBoard'
import { TsumeSolver } from './TsumeSolver'
import { saveTsumeProblem, type SaveTsumeInput } from '@/app/(adult)/family/tsume/actions'

// 並べられる駒（玉＝先に置く）
const PLACE_PIECES: { letter: string; kanji: string }[] = [
  { letter: 'K', kanji: '玉' },
  { letter: 'R', kanji: '飛' },
  { letter: 'B', kanji: '角' },
  { letter: 'G', kanji: '金' },
  { letter: 'S', kanji: '銀' },
  { letter: 'N', kanji: '桂' },
  { letter: 'L', kanji: '香' },
  { letter: 'P', kanji: '歩' }
]
// 持ち駒にできる駒
const HAND_PIECES: { letter: string; kanji: string }[] = [
  { letter: 'R', kanji: '飛' },
  { letter: 'B', kanji: '角' },
  { letter: 'G', kanji: '金' },
  { letter: 'S', kanji: '銀' },
  { letter: 'N', kanji: '桂' },
  { letter: 'L', kanji: '香' },
  { letter: 'P', kanji: '歩' }
]

const LEVELS: { value: TsumeLevel; label: string }[] = [
  { value: 'easy', label: 'やさしい（3手くらい）' },
  { value: 'normal', label: 'ふつう（5手くらい）' },
  { value: 'hard', label: '手ごわい（7手以上）' },
  { value: 'master', label: '名人級' },
  { value: 'demo', label: 'おためし' }
]

type Brush =
  | { kind: 'piece'; letter: string; black: boolean; promoted: boolean }
  | { kind: 'erase' }
  | null

type BuiltState =
  | { status: 'empty' }
  | { status: 'error'; error: string }
  | {
      status: 'ready'
      startSfen: string
      movesUsi: string[]
      movesJa: string[]
      frames: string[]
      finalSfen: string
    }

export type TsumeEditorInitial = {
  id: string
  title: string
  level: string
  startSfen: string
  movesUsi: string[]
  composer: string
  source: string
  note: string
  published: boolean
}

const PROMOTABLE_LETTERS = new Set(['P', 'L', 'N', 'S', 'B', 'R'])

export function TsumeEditor({ initial }: { initial?: TsumeEditorInitial }) {
  const router = useRouter()
  const editing = Boolean(initial)

  // 入力方法のタブ：盤で並べる / 記号(SFEN)を貼り付ける
  const [modeTab, setModeTab] = useState<'board' | 'sfen'>('board')

  // ── 盤モード ──
  const [boardPhase, setBoardPhase] = useState<'setup' | 'record'>(
    initial ? 'record' : 'setup'
  )
  const [setupPos, setSetupPos] = useState<Position>(() =>
    initial ? parseSfenFull(initial.startSfen) : emptyPosition()
  )
  const [lockedStartSfen, setLockedStartSfen] = useState<string>(initial?.startSfen ?? '')
  const [recordedUsi, setRecordedUsi] = useState<string[]>(initial?.movesUsi ?? [])
  const [brush, setBrush] = useState<Brush>(null)
  const [brushBlack, setBrushBlack] = useState(true) // 並べる駒の向き（攻め方/玉方）
  const [brushPromoted, setBrushPromoted] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [selectedDrop, setSelectedDrop] = useState<{ side: 'b' | 'w'; letter: string } | null>(
    null
  )
  const [pendingPromo, setPendingPromo] = useState<{ from: number; to: number } | null>(null)

  // ── 記号(SFEN)モード ──
  const [sfenStart, setSfenStart] = useState(initial?.startSfen ?? '')
  const [sfenMovesText, setSfenMovesText] = useState((initial?.movesUsi ?? []).join(' '))
  const [sfenChecked, setSfenChecked] = useState(false)
  const [sfenResult, setSfenResult] = useState<BuiltState>({ status: 'empty' })

  // ── 共通フォーム ──
  const [title, setTitle] = useState(initial?.title ?? '')
  const [level, setLevel] = useState<string>(initial?.level ?? 'easy')
  const [source, setSource] = useState(initial?.source ?? '')
  const [composer, setComposer] = useState(initial?.composer ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [published, setPublished] = useState(initial?.published ?? false)

  const [showSolve, setShowSolve] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── record の生きている盤面（recordedUsi を開始局面に適用した結果） ──
  const recordBuild = useMemo(
    () => (lockedStartSfen ? buildFrames(lockedStartSfen, recordedUsi) : null),
    [lockedStartSfen, recordedUsi]
  )
  const wpos: Position | null = useMemo(() => {
    if (!recordBuild || !recordBuild.ok) return null
    return parseSfenFull(recordBuild.frames[recordBuild.frames.length - 1])
  }, [recordBuild])
  const lastMoveTo =
    recordedUsi.length > 0 ? parseUsiMove(recordedUsi[recordedUsi.length - 1]).toIdx : null

  // ── 「いまの問題」（保存・ためし解き用） ──
  const built = useMemo<BuiltState>(() => {
    if (modeTab === 'sfen') return sfenResult
    if (boardPhase === 'setup') return { status: 'empty' }
    if (!recordBuild) return { status: 'empty' }
    if (!recordBuild.ok) return { status: 'error', error: recordBuild.error }
    if (recordedUsi.length === 0) return { status: 'empty' }
    return {
      status: 'ready',
      startSfen: lockedStartSfen,
      movesUsi: recordedUsi,
      movesJa: recordBuild.movesJa,
      frames: recordBuild.frames,
      finalSfen: recordBuild.finalSfen
    }
  }, [modeTab, sfenResult, boardPhase, recordBuild, recordedUsi, lockedStartSfen])

  const previewProblem: TsumeProblem | null = useMemo(() => {
    if (built.status !== 'ready') return null
    return {
      id: 'preview',
      tesuu: built.movesUsi.length,
      level: (level as TsumeLevel) || 'easy',
      startSfen: built.startSfen,
      finalSfen: built.finalSfen,
      movesJa: built.movesJa,
      movesUsi: built.movesUsi,
      frames: built.frames,
      title: title || undefined,
      source: source || undefined,
      composer: composer || undefined,
      note: note || undefined
    }
  }, [built, level, title, source, composer, note])

  // ───────────────── 盤：並べる（setup） ─────────────────
  const placeAt = useCallback(
    (idx: number) => {
      setSetupPos((prev) => {
        const board = prev.board.slice()
        if (!brush) {
          // ブラシ未選択：タップでそのマスを消す
          board[idx] = null
          return { ...prev, board }
        }
        if (brush.kind === 'erase') {
          board[idx] = null
          return { ...prev, board }
        }
        // 玉は片側1枚まで（同じ側の既存の玉を消す）
        if (brush.letter === 'K') {
          for (let i = 0; i < 81; i++) {
            const c = board[i]
            if (c && c.letter === 'K' && c.black === brush.black) board[i] = null
          }
        }
        const promoted = brush.promoted && PROMOTABLE_LETTERS.has(brush.letter)
        board[idx] = { letter: brush.letter, promoted, black: brush.black }
        return { ...prev, board }
      })
    },
    [brush]
  )

  const adjustHand = useCallback((side: 'b' | 'w', letter: string, delta: number) => {
    setSetupPos((prev) => {
      const key = side === 'b' ? 'blackHand' : 'whiteHand'
      const hand = { ...prev[key] }
      const next = Math.max(0, (hand[letter] ?? 0) + delta)
      if (next === 0) delete hand[letter]
      else hand[letter] = next
      return { ...prev, [key]: hand }
    })
  }, [])

  const startRecording = useCallback(() => {
    const sfen = positionToSfen({ ...setupPos, turn: 'b', moveNum: 1 })
    setLockedStartSfen(sfen)
    setRecordedUsi([])
    setSelectedIdx(null)
    setSelectedDrop(null)
    setPendingPromo(null)
    setBoardPhase('record')
    setShowSolve(false)
  }, [setupPos])

  const backToSetup = useCallback(() => {
    setBoardPhase('setup')
    setRecordedUsi([])
    setSelectedIdx(null)
    setSelectedDrop(null)
    setPendingPromo(null)
    setShowSolve(false)
  }, [])

  // ───────────────── 盤：答えを指す（record） ─────────────────
  const finalizeMove = useCallback((from: number, to: number, promo: boolean) => {
    const usi = idxToUsiSquare(from) + idxToUsiSquare(to) + (promo ? '+' : '')
    setRecordedUsi((prev) => [...prev, usi])
    setSelectedIdx(null)
    setSelectedDrop(null)
    setPendingPromo(null)
  }, [])

  const tryMove = useCallback(
    (from: number, to: number) => {
      if (!wpos) return
      const piece = wpos.board[from]
      if (!piece) return
      const state = promotionState(piece, from, to)
      if (state === 'forced') finalizeMove(from, to, true)
      else if (state === 'none') finalizeMove(from, to, false)
      else setPendingPromo({ from, to })
    },
    [wpos, finalizeMove]
  )

  const handleRecordCellClick = useCallback(
    (idx: number) => {
      if (!wpos || pendingPromo) return
      const turnBlack = wpos.turn === 'b'
      const cell = wpos.board[idx]
      // 手番の側の駒をタップ → 選択
      if (cell && cell.black === turnBlack) {
        setSelectedIdx(idx)
        setSelectedDrop(null)
        return
      }
      // 打つ駒を選んでいる → そこに打つ
      if (selectedDrop) {
        const usi = `${selectedDrop.letter}*${idxToUsiSquare(idx)}`
        setRecordedUsi((prev) => [...prev, usi])
        setSelectedIdx(null)
        setSelectedDrop(null)
        return
      }
      // 動かす駒を選んでいる → そこへ動かす
      if (selectedIdx !== null) tryMove(selectedIdx, idx)
    },
    [wpos, pendingPromo, selectedDrop, selectedIdx, tryMove]
  )

  const handleRecordHandClick = useCallback(
    (side: 'b' | 'w', letter: string) => {
      if (!wpos || pendingPromo) return
      const turnBlack = wpos.turn === 'b'
      if ((side === 'b') !== turnBlack) return // 手番でない側の持ち駒は打てない
      setSelectedDrop({ side, letter })
      setSelectedIdx(null)
    },
    [wpos, pendingPromo]
  )

  const undoMove = useCallback(() => {
    setRecordedUsi((prev) => prev.slice(0, -1))
    setSelectedIdx(null)
    setSelectedDrop(null)
    setPendingPromo(null)
  }, [])

  const resetAnswer = useCallback(() => {
    setRecordedUsi([])
    setSelectedIdx(null)
    setSelectedDrop(null)
    setPendingPromo(null)
  }, [])

  // ───────────────── 記号(SFEN)モード ─────────────────
  const checkSfen = useCallback(() => {
    const start = sfenStart.trim()
    if (!start) {
      setSfenChecked(true)
      setSfenResult({ status: 'error', error: '開始局面の記号(SFEN)を入れてください' })
      return
    }
    const moves = sfenMovesText
      .split(/[\s,、，]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (moves.length === 0) {
      setSfenChecked(true)
      setSfenResult({ status: 'error', error: '答えの手順(USI)を入れてください' })
      return
    }
    const r = buildFrames(start, moves)
    setSfenChecked(true)
    if (!r.ok) {
      setSfenResult({ status: 'error', error: r.error })
      return
    }
    setSfenResult({
      status: 'ready',
      startSfen: start,
      movesUsi: moves,
      movesJa: r.movesJa,
      frames: r.frames,
      finalSfen: r.finalSfen
    })
  }, [sfenStart, sfenMovesText])

  // ───────────────── 保存 ─────────────────
  const onSave = useCallback(async () => {
    if (built.status !== 'ready') {
      setError('まだ問題ができていません。答えの手を指すか、記号を確認してください。')
      return
    }
    setError(null)
    setSaving(true)
    const input: SaveTsumeInput = {
      id: initial?.id,
      title,
      tesuu: built.movesUsi.length,
      level,
      startSfen: built.startSfen,
      finalSfen: built.finalSfen,
      movesJa: built.movesJa,
      movesUsi: built.movesUsi,
      frames: built.frames,
      composer,
      source,
      note,
      published
    }
    const res = await saveTsumeProblem(input)
    setSaving(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    router.push('/family/tsume')
    router.refresh()
  }, [built, initial?.id, title, level, composer, source, note, published, router])

  const tesuuNow = built.status === 'ready' ? built.movesUsi.length : 0

  return (
    <div className="flex flex-col gap-5">
      {/* 入力方法タブ */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setModeTab('board')}
          className={`flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] rounded-xl border font-mincho text-sm font-semibold transition-colors ${
            modeTab === 'board'
              ? 'bg-accent text-white border-accent'
              : 'bg-surface text-text-muted border-border hover:border-accent'
          }`}
        >
          <LayoutGrid className="w-4 h-4" /> 盤に並べて作る
        </button>
        <button
          type="button"
          onClick={() => setModeTab('sfen')}
          className={`flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] rounded-xl border font-mincho text-sm font-semibold transition-colors ${
            modeTab === 'sfen'
              ? 'bg-accent text-white border-accent'
              : 'bg-surface text-text-muted border-border hover:border-accent'
          }`}
        >
          <Keyboard className="w-4 h-4" /> 記号で作る
        </button>
      </div>

      {/* ───────── 盤モード ───────── */}
      {modeTab === 'board' && boardPhase === 'setup' && (
        <section className="bg-surface border border-border rounded-3xl p-4 sm:p-5 flex flex-col items-center gap-4">
          <div className="text-center">
            <p className="text-sm font-bold text-accent font-mincho">
              ステップ1：駒を並べる
            </p>
            <p className="text-xs text-text-muted font-mincho mt-1">
              下から駒をえらんで、盤をタップで置く。もう一度タップで消えます。
            </p>
          </div>

          <EditBoard position={setupPos} onCellClick={placeAt} selectedIdx={null} />

          {/* 向き（攻め方/玉方）と 成り */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <div className="inline-flex rounded-xl border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setBrushBlack(true)}
                className={`px-3 min-h-[44px] text-sm font-mincho ${
                  brushBlack ? 'bg-accent text-white' : 'bg-surface text-text-muted'
                }`}
              >
                ▲攻め方
              </button>
              <button
                type="button"
                onClick={() => setBrushBlack(false)}
                className={`px-3 min-h-[44px] text-sm font-mincho ${
                  !brushBlack ? 'bg-accent text-white' : 'bg-surface text-text-muted'
                }`}
              >
                △玉方
              </button>
            </div>
            <button
              type="button"
              onClick={() => setBrushPromoted((v) => !v)}
              className={`px-3 min-h-[44px] rounded-xl border text-sm font-mincho ${
                brushPromoted
                  ? 'bg-fire/10 text-fire border-fire/40'
                  : 'bg-surface text-text-muted border-border'
              }`}
            >
              成り {brushPromoted ? 'オン' : 'オフ'}
            </button>
            <button
              type="button"
              onClick={() => setBrush({ kind: 'erase' })}
              className={`inline-flex items-center gap-1 px-3 min-h-[44px] rounded-xl border text-sm font-mincho ${
                brush?.kind === 'erase'
                  ? 'bg-fire text-white border-fire'
                  : 'bg-surface text-text-muted border-border'
              }`}
            >
              <Eraser className="w-4 h-4" /> 消す
            </button>
          </div>

          {/* 置く駒のパレット */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {PLACE_PIECES.map((p) => {
              const active =
                brush?.kind === 'piece' &&
                brush.letter === p.letter &&
                brush.black === brushBlack &&
                brush.promoted === (brushPromoted && PROMOTABLE_LETTERS.has(p.letter))
              const showPromo = brushPromoted && PROMOTABLE_LETTERS.has(p.letter)
              const promKanji: Record<string, string> = {
                P: 'と',
                L: '杏',
                N: '圭',
                S: '全',
                B: '馬',
                R: '龍'
              }
              return (
                <button
                  key={p.letter}
                  type="button"
                  onClick={() =>
                    setBrush({
                      kind: 'piece',
                      letter: p.letter,
                      black: brushBlack,
                      promoted: brushPromoted && PROMOTABLE_LETTERS.has(p.letter)
                    })
                  }
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-xl border text-xl font-bold transition-all active:scale-95 ${
                    active
                      ? 'bg-accent text-white border-accent ring-2 ring-accent/40'
                      : 'bg-[#f6e4bd] border-[#caa766] text-stone-900 hover:border-accent'
                  }`}
                  style={{
                    transform: brushBlack ? undefined : 'rotate(180deg)',
                    color: active ? undefined : showPromo ? '#b91c1c' : undefined
                  }}
                >
                  {showPromo ? promKanji[p.letter] : p.kanji}
                </button>
              )
            })}
          </div>

          {/* 持ち駒の編集 */}
          <div className="w-full flex flex-col gap-3 border-t border-border pt-3">
            <HandEditor
              label="攻め方の もち駒"
              side="b"
              hand={setupPos.blackHand}
              onAdjust={adjustHand}
            />
            <HandEditor
              label="玉方の もち駒"
              side="w"
              hand={setupPos.whiteHand}
              onAdjust={adjustHand}
            />
          </div>

          <button
            type="button"
            onClick={startRecording}
            className="inline-flex items-center gap-2 px-6 min-h-[52px] rounded-full bg-accent text-white font-mincho text-base font-bold shadow-[0_4px_16px_rgba(30,64,175,0.25)] hover:bg-accent-deep active:scale-95 transition-all"
          >
            <Play className="w-5 h-5" /> この続きを指して答えを作る
          </button>
        </section>
      )}

      {modeTab === 'board' && boardPhase === 'record' && wpos && (
        <section className="bg-surface border border-border rounded-3xl p-4 sm:p-5 flex flex-col items-center gap-4">
          <div className="text-center">
            <p className="text-sm font-bold text-accent font-mincho">
              ステップ2：答えを指す（{wpos.turn === 'b' ? '▲攻め方の番' : '△玉方の番'}）
            </p>
            <p className="text-xs text-text-muted font-mincho mt-1">
              駒をタップ → 行き先をタップ。攻め方・玉方を交互に、詰むまで指してください。
            </p>
          </div>

          <EditBoard
            position={wpos}
            selectedIdx={selectedIdx}
            selectedDrop={selectedDrop}
            lastMoveTo={lastMoveTo}
            onCellClick={handleRecordCellClick}
            onHandClick={handleRecordHandClick}
            disabled={Boolean(pendingPromo)}
          />

          {/* 成る？ダイアログ */}
          {pendingPromo && (
            <div className="w-full bg-gold-soft/60 border border-gold/40 rounded-2xl p-3 flex flex-col items-center gap-2">
              <p className="text-sm font-mincho font-semibold text-gold-deep">成りますか？</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => finalizeMove(pendingPromo.from, pendingPromo.to, true)}
                  className="px-5 min-h-[44px] rounded-full bg-fire text-white font-mincho text-sm font-bold active:scale-95"
                >
                  成る
                </button>
                <button
                  type="button"
                  onClick={() => finalizeMove(pendingPromo.from, pendingPromo.to, false)}
                  className="px-5 min-h-[44px] rounded-full bg-white border border-border text-text-muted font-mincho text-sm active:scale-95"
                >
                  成らない
                </button>
              </div>
            </div>
          )}

          {/* 記録された手順 */}
          <div className="w-full bg-accent-soft/40 rounded-2xl p-3">
            <div className="text-xs text-text-muted font-mincho mb-1">
              これまでの手順（{recordedUsi.length}手）
            </div>
            {recordBuild && recordBuild.ok && recordBuild.movesJa.length > 0 ? (
              <ol className="flex flex-wrap gap-x-3 gap-y-1 font-num text-base font-semibold text-accent-deep">
                {recordBuild.movesJa.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-text-dim font-mincho">まだ指していません</p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={undoMove}
              disabled={recordedUsi.length === 0}
              className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-full bg-white border border-border text-text-muted hover:text-accent hover:border-accent font-mincho text-sm active:scale-95 disabled:opacity-40"
            >
              <Undo2 className="w-4 h-4" /> 1手もどす
            </button>
            <button
              type="button"
              onClick={resetAnswer}
              className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-full bg-white border border-border text-text-muted hover:text-accent hover:border-accent font-mincho text-sm active:scale-95"
            >
              <RotateCcw className="w-4 h-4" /> 答えを消す
            </button>
            <button
              type="button"
              onClick={backToSetup}
              className="inline-flex items-center gap-1.5 px-4 min-h-[44px] rounded-full bg-white border border-border text-text-muted hover:text-accent hover:border-accent font-mincho text-sm active:scale-95"
            >
              <Pencil className="w-4 h-4" /> 盤を並べ直す
            </button>
          </div>
        </section>
      )}

      {/* ───────── 記号(SFEN)モード ───────── */}
      {modeTab === 'sfen' && (
        <section className="bg-surface border border-border rounded-3xl p-4 sm:p-5 flex flex-col gap-3">
          <p className="text-sm font-bold text-accent font-mincho">記号で作る（上級者向け）</p>
          <label className="text-xs text-text-muted font-mincho">開始局面の記号（SFEN）</label>
          <textarea
            value={sfenStart}
            onChange={(e) => {
              setSfenStart(e.target.value)
              setSfenChecked(false)
            }}
            rows={2}
            placeholder="例：9/9/7k1/5BS2/9/5B3/9/9/1K7 b - 1"
            className="w-full rounded-xl border border-border bg-white px-3 py-2 font-mono text-sm"
          />
          <label className="text-xs text-text-muted font-mincho">答えの手順（USI・空白か改行で区切る）</label>
          <textarea
            value={sfenMovesText}
            onChange={(e) => {
              setSfenMovesText(e.target.value)
              setSfenChecked(false)
            }}
            rows={2}
            placeholder="例：4d3c+ 2c1b 3d2c 1b2a 2c2b+"
            className="w-full rounded-xl border border-border bg-white px-3 py-2 font-mono text-sm"
          />
          <button
            type="button"
            onClick={checkSfen}
            className="self-start inline-flex items-center gap-1.5 px-5 min-h-[44px] rounded-full bg-accent text-white font-mincho text-sm font-bold active:scale-95"
          >
            <Sparkles className="w-4 h-4" /> 確認する（盤に直す）
          </button>

          {sfenChecked && sfenResult.status === 'error' && (
            <p className="text-sm text-fire font-mincho">
              うまく読めませんでした：{sfenResult.error}
            </p>
          )}
          {sfenChecked && sfenResult.status === 'ready' && (
            <div className="flex flex-col items-center gap-2 border-t border-border pt-3">
              <p className="text-sm text-success font-mincho font-semibold">
                読めました！{sfenResult.movesUsi.length}手詰
              </p>
              <EditBoard position={parseSfenFull(sfenResult.startSfen)} onCellClick={() => {}} disabled />
              <ol className="flex flex-wrap gap-x-3 gap-y-1 font-num text-base font-semibold text-accent-deep justify-center">
                {sfenResult.movesJa.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ol>
            </div>
          )}
        </section>
      )}

      {/* ───────── くわしい情報 ───────── */}
      <section className="bg-surface border border-border rounded-3xl p-4 sm:p-5 flex flex-col gap-3">
        <p className="text-sm font-bold text-accent font-mincho">ステップ3：名前とむずかしさ</p>

        <label className="text-xs text-text-muted font-mincho">タイトル（なくてもOK）</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例：あぶり出し・銀の妙手"
          className="w-full rounded-xl border border-border bg-white px-3 min-h-[44px]"
        />

        <label className="text-xs text-text-muted font-mincho">むずかしさ</label>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="w-full rounded-xl border border-border bg-white px-3 min-h-[44px]"
        >
          {LEVELS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>

        <label className="text-xs text-text-muted font-mincho">出どころ（なくてもOK）</label>
        <input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="例：はじめ先生 作 / 将棋図巧 第1番"
          className="w-full rounded-xl border border-border bg-white px-3 min-h-[44px]"
        />

        <label className="text-xs text-text-muted font-mincho">作者（古典のときだけ）</label>
        <input
          value={composer}
          onChange={(e) => setComposer(e.target.value)}
          placeholder="例：伊藤看寿"
          className="w-full rounded-xl border border-border bg-white px-3 min-h-[44px]"
        />

        <label className="text-xs text-text-muted font-mincho">ひとこと解説（なくてもOK）</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="例：玉の逃げ道を先に消すのがコツ"
          className="w-full rounded-xl border border-border bg-white px-3 py-2"
        />
      </section>

      {/* ───────── ためし解き ───────── */}
      <section className="bg-surface border border-border rounded-3xl p-4 sm:p-5 flex flex-col gap-3 items-center">
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <button
            type="button"
            onClick={() => setShowSolve((v) => !v)}
            disabled={!previewProblem}
            className="inline-flex items-center gap-1.5 px-5 min-h-[48px] rounded-full bg-gold-soft text-gold-deep border border-gold/40 font-mincho text-sm font-bold active:scale-95 disabled:opacity-40"
          >
            <Eye className="w-4 h-4" /> {showSolve ? 'ためし解きを閉じる' : 'ためし解きする'}
          </button>
          {built.status === 'ready' && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-accent text-white font-num">
              {tesuuNow}手詰
            </span>
          )}
          {built.status === 'error' && (
            <span className="text-xs text-fire font-mincho">手順に問題があります：{built.error}</span>
          )}
          {built.status === 'empty' && (
            <span className="text-xs text-text-dim font-mincho">
              答えの手を指すと、ここでためし解きできます
            </span>
          )}
        </div>
        {showSolve && previewProblem && (
          <div className="w-full">
            <TsumeSolver problems={[previewProblem]} single />
          </div>
        )}
      </section>

      {/* ───────── 保存 ───────── */}
      <section className="bg-surface border border-border rounded-3xl p-4 sm:p-5 flex flex-col gap-3">
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="w-5 h-5 accent-accent"
          />
          <span className="font-mincho text-sm font-semibold">
            公開する（押すと生徒・保護者の画面に出る）
          </span>
        </label>
        <p className="text-[11px] text-text-dim font-mincho">
          チェックを外して保存すると「下書き」になります（先生だけ見えます）。
        </p>

        {error && <p className="text-sm text-fire font-mincho">{error}</p>}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={saving || built.status !== 'ready'}
            className="flex-1 inline-flex items-center justify-center gap-2 min-h-[54px] rounded-full bg-accent text-white font-mincho text-base font-bold shadow-[0_4px_16px_rgba(30,64,175,0.25)] hover:bg-accent-deep active:scale-95 transition-all disabled:opacity-40"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {editing ? '上書き保存する' : '保存する'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/family/tsume')}
            className="px-5 min-h-[54px] rounded-full bg-white border border-border text-text-muted hover:text-accent hover:border-accent font-mincho text-sm active:scale-95"
          >
            やめる
          </button>
        </div>
      </section>
    </div>
  )
}

function HandEditor({
  label,
  side,
  hand,
  onAdjust
}: {
  label: string
  side: 'b' | 'w'
  hand: Record<string, number>
  onAdjust: (side: 'b' | 'w', letter: string, delta: number) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] text-text-dim font-mincho">{label}</span>
      <div className="flex flex-wrap gap-2">
        {HAND_PIECES.map((p) => {
          const count = hand[p.letter] ?? 0
          return (
            <div
              key={p.letter}
              className={`inline-flex items-center rounded-xl border overflow-hidden ${
                count > 0 ? 'border-accent' : 'border-border'
              }`}
            >
              <button
                type="button"
                onClick={() => onAdjust(side, p.letter, -1)}
                className="w-8 min-h-[40px] text-text-muted hover:bg-surface-elevated active:scale-95"
              >
                −
              </button>
              <span className="w-9 text-center text-sm font-bold">
                {p.kanji}
                <span className="font-num text-xs text-text-muted">{count > 0 ? count : ''}</span>
              </span>
              <button
                type="button"
                onClick={() => onAdjust(side, p.letter, 1)}
                className="w-8 min-h-[40px] text-text-muted hover:bg-surface-elevated active:scale-95"
              >
                ＋
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
