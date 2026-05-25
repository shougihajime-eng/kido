'use client'

import { parseSfen, FILE_LABELS, RANK_LABELS, type HandPiece } from '@/lib/tsume'

const BOARD_W = 'min(90vw, 22rem)'
const CELL = `calc(${BOARD_W} / 9)`
const PIECE_FONT = `calc(${BOARD_W} / 9 * 0.58)`

type Props = {
  sfen: string
  selectedIdx: number | null
  selectedDrop: string | null
  hintIdx?: number | null
  lastMoveTo?: number | null
  /** 盤のマスをタップ */
  onCellClick: (idx: number) => void
  /** 攻め方（先手）の持ち駒をタップ */
  onHandClick: (letter: string) => void
  /** 操作を受け付けるか（詰み後などは false） */
  disabled?: boolean
}

function WhiteHandRow({ hand }: { hand: HandPiece[] }) {
  return (
    <div className="flex items-center gap-2 w-full" style={{ maxWidth: BOARD_W }}>
      <span className="text-[11px] text-text-dim shrink-0 font-mincho">玉方 もち駒</span>
      <div className="flex flex-wrap items-center gap-1 min-h-[1.6rem]">
        {hand.length === 0 ? (
          <span className="text-[11px] text-text-dim">なし</span>
        ) : (
          hand.map((h, i) => (
            <span
              key={i}
              className="inline-flex items-center justify-center rounded bg-[#f6e4bd] border border-[#caa766] text-stone-900 font-bold leading-none px-1.5 py-1 text-sm"
              style={{ transform: 'rotate(180deg)' }}
            >
              {h.kanji}
              {h.count > 1 && <span className="ml-0.5 text-[10px]">{h.count}</span>}
            </span>
          ))
        )}
      </div>
    </div>
  )
}

export function SolveBoard({
  sfen,
  selectedIdx,
  selectedDrop,
  hintIdx,
  lastMoveTo,
  onCellClick,
  onHandClick,
  disabled
}: Props) {
  const { cells, blackHand, whiteHand } = parseSfen(sfen)

  return (
    <div className="flex flex-col items-center gap-2">
      <WhiteHandRow hand={whiteHand} />

      <div className="flex flex-col items-end">
        <div
          className="grid grid-cols-9 text-[11px] text-text-dim font-num"
          style={{ width: BOARD_W }}
        >
          {FILE_LABELS.map((f) => (
            <span key={f} className="text-center pb-0.5">
              {f}
            </span>
          ))}
        </div>

        <div className="flex">
          <div
            className="grid grid-cols-9 bg-[#f0d49b] border-[3px] border-[#7c5a2e] shadow-md"
            style={{ width: BOARD_W }}
          >
            {cells.map((cell, i) => {
              const isSelected = i === selectedIdx
              const isHint = i === hintIdx
              const isLast = i === lastMoveTo
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => onCellClick(i)}
                  className="relative flex items-center justify-center border-[0.5px] border-[#9c7a44]/70 active:bg-accent/20 disabled:cursor-default"
                  style={{
                    width: CELL,
                    height: CELL,
                    backgroundColor: isSelected
                      ? 'rgba(30,64,175,0.30)'
                      : isHint
                        ? 'rgba(202,138,4,0.35)'
                        : isLast
                          ? 'rgba(30,64,175,0.10)'
                          : undefined
                  }}
                >
                  {cell && (
                    <span
                      className="inline-flex items-center justify-center font-bold leading-none text-stone-900"
                      style={{
                        fontSize: PIECE_FONT,
                        transform: cell.black ? undefined : 'rotate(180deg)',
                        color: cell.promoted ? '#b91c1c' : undefined
                      }}
                    >
                      {cell.kanji}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div
            className="flex flex-col justify-around text-[11px] text-text-dim pl-1 font-mincho"
            style={{ height: BOARD_W }}
          >
            {RANK_LABELS.map((r) => (
              <span key={r} className="text-center leading-none">
                {r}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 攻め方（先手）の持ち駒：タップで打つ駒を選べる */}
      <div className="flex items-center gap-2 w-full" style={{ maxWidth: BOARD_W }}>
        <span className="text-[11px] text-text-dim shrink-0 font-mincho">攻め方 もち駒</span>
        <div className="flex flex-wrap items-center gap-1.5 min-h-[2rem]">
          {blackHand.length === 0 ? (
            <span className="text-[11px] text-text-dim">なし</span>
          ) : (
            blackHand.map((h, i) => {
              const sel = selectedDrop === h.letter
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => onHandClick(h.letter)}
                  className={`inline-flex items-center justify-center rounded border font-bold leading-none px-2 py-1.5 text-base transition-all active:scale-95 disabled:cursor-default ${
                    sel
                      ? 'bg-accent text-white border-accent ring-2 ring-accent/40'
                      : 'bg-[#f6e4bd] border-[#caa766] text-stone-900 hover:border-accent'
                  }`}
                >
                  {h.kanji}
                  {h.count > 1 && <span className="ml-0.5 text-[10px]">{h.count}</span>}
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
