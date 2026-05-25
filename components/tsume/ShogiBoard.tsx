import { parseSfen, FILE_LABELS, RANK_LABELS, type HandPiece } from '@/lib/tsume'

// 盤の大きさ（レスポンシブ）。盤・筋番号・段番号で共有する
const BOARD_W = 'min(88vw, 21rem)'
const CELL = `calc(${BOARD_W} / 9)`
const PIECE_FONT = `calc(${BOARD_W} / 9 * 0.6)`

function HandRow({ label, hand, flip }: { label: string; hand: HandPiece[]; flip?: boolean }) {
  return (
    <div
      className="flex items-center gap-2 w-full"
      style={{ maxWidth: BOARD_W }}
    >
      <span className="text-[11px] text-text-dim shrink-0 font-mincho">{label}</span>
      <div className="flex flex-wrap items-center gap-1 min-h-[1.6rem]">
        {hand.length === 0 ? (
          <span className="text-[11px] text-text-dim">なし</span>
        ) : (
          hand.map((h, i) => (
            <span
              key={i}
              className="inline-flex items-center justify-center rounded bg-[#f6e4bd] border border-[#caa766] text-stone-900 font-bold leading-none px-1.5 py-1 text-sm"
              style={{ transform: flip ? 'rotate(180deg)' : undefined }}
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

export function ShogiBoard({ sfen }: { sfen: string }) {
  const { cells, blackHand, whiteHand } = parseSfen(sfen)

  return (
    <div className="flex flex-col items-center gap-2">
      {/* 玉方（後手）の持ち駒：上向きが逆さ */}
      <HandRow label="玉方 もち駒" hand={whiteHand} flip />

      <div className="flex flex-col items-end">
        {/* 筋番号（9→1） */}
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
          {/* 盤 */}
          <div
            className="grid grid-cols-9 bg-[#f0d49b] border-[3px] border-[#7c5a2e] shadow-md"
            style={{ width: BOARD_W }}
          >
            {cells.map((cell, i) => (
              <div
                key={i}
                className="flex items-center justify-center border-[0.5px] border-[#9c7a44]/70"
                style={{ width: CELL, height: CELL }}
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
              </div>
            ))}
          </div>

          {/* 段番号（一→九） */}
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

      {/* 攻め方（先手）の持ち駒 */}
      <HandRow label="攻め方 もち駒" hand={blackHand} />
    </div>
  )
}
