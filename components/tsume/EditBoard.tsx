'use client'

import type { Position, Square } from '@/lib/shogi-move'
import { FILE_LABELS, RANK_LABELS } from '@/lib/tsume'

const BOARD_W = 'min(92vw, 23rem)'
const CELL = `calc(${BOARD_W} / 9)`
const PIECE_FONT = `calc(${BOARD_W} / 9 * 0.56)`

const BASE_KANJI: Record<string, string> = {
  P: '歩',
  L: '香',
  N: '桂',
  S: '銀',
  G: '金',
  B: '角',
  R: '飛',
  K: '玉'
}
const PROM_KANJI: Record<string, string> = {
  P: 'と',
  L: '杏',
  N: '圭',
  S: '全',
  B: '馬',
  R: '龍'
}

export function squareKanji(sq: NonNullable<Square>): string {
  if (sq.letter === 'K') return '玉'
  if (sq.promoted) return PROM_KANJI[sq.letter] ?? sq.letter
  return BASE_KANJI[sq.letter] ?? sq.letter
}

type HandRow = { letter: string; count: number }

type Props = {
  position: Position
  selectedIdx?: number | null
  hintIdx?: number | null
  lastMoveTo?: number | null
  onCellClick: (idx: number) => void
  /** 持ち駒タップ（打つ駒を選ぶ／record時のみ）。side は 'b'|'w' */
  onHandClick?: (side: 'b' | 'w', letter: string) => void
  selectedDrop?: { side: 'b' | 'w'; letter: string } | null
  disabled?: boolean
}

function handList(hand: Record<string, number>): HandRow[] {
  const order = ['R', 'B', 'G', 'S', 'N', 'L', 'P']
  return order.filter((l) => (hand[l] ?? 0) > 0).map((l) => ({ letter: l, count: hand[l] }))
}

function HandStrip({
  label,
  side,
  hand,
  rotate,
  onHandClick,
  selectedDrop,
  disabled
}: {
  label: string
  side: 'b' | 'w'
  hand: Record<string, number>
  rotate: boolean
  onHandClick?: (side: 'b' | 'w', letter: string) => void
  selectedDrop?: { side: 'b' | 'w'; letter: string } | null
  disabled?: boolean
}) {
  const list = handList(hand)
  return (
    <div className="flex items-center gap-2 w-full" style={{ maxWidth: BOARD_W }}>
      <span className="text-[11px] text-text-dim shrink-0 font-mincho">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5 min-h-[1.9rem]">
        {list.length === 0 ? (
          <span className="text-[11px] text-text-dim">なし</span>
        ) : (
          list.map((h) => {
            const sel =
              selectedDrop && selectedDrop.side === side && selectedDrop.letter === h.letter
            const tappable = Boolean(onHandClick) && !disabled
            return (
              <button
                key={h.letter}
                type="button"
                disabled={!tappable}
                onClick={() => onHandClick?.(side, h.letter)}
                className={`inline-flex items-center justify-center rounded border font-bold leading-none px-2 py-1.5 text-base transition-all disabled:cursor-default ${
                  sel
                    ? 'bg-accent text-white border-accent ring-2 ring-accent/40'
                    : 'bg-[#f6e4bd] border-[#caa766] text-stone-900'
                } ${tappable ? 'active:scale-95 hover:border-accent' : ''}`}
                style={{ transform: rotate ? 'rotate(180deg)' : undefined }}
              >
                {BASE_KANJI[h.letter] ?? h.letter}
                {h.count > 1 && <span className="ml-0.5 text-[10px]">{h.count}</span>}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

export function EditBoard({
  position,
  selectedIdx,
  hintIdx,
  lastMoveTo,
  onCellClick,
  onHandClick,
  selectedDrop,
  disabled
}: Props) {
  return (
    <div className="flex flex-col items-center gap-2">
      <HandStrip
        label="玉方 もち駒"
        side="w"
        hand={position.whiteHand}
        rotate
        onHandClick={onHandClick}
        selectedDrop={selectedDrop}
        disabled={disabled}
      />

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
            {position.board.map((cell, i) => {
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
                      {squareKanji(cell)}
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

      <HandStrip
        label="攻め方 もち駒"
        side="b"
        hand={position.blackHand}
        rotate={false}
        onHandClick={onHandClick}
        selectedDrop={selectedDrop}
        disabled={disabled}
      />
    </div>
  )
}
