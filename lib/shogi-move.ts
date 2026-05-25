// 将棋の「指し手を盤に反映する」仕組み（純粋なロジック）
//
// ■ 何のため？
//   先生が詰将棋を作るとき、盤に駒を並べて「答えの手」を指していくと、
//   この仕組みが1手ごとに盤面を進めて
//     - frames（1手ごとの盤面 SFEN の配列。指で解くときに使う）
//     - movesJa（▲５二金打 のような日本語表記。表示用）
//     - finalSfen（詰み上がりの盤面）
//   を自動で作る。記号（SFEN）貼り付けで作るときも同じ仕組みを通す。
//
//   ※ ここでは「合法手かどうか」「本当に詰むか」までは判定しない（それは
//      python のソルバーや、画面の「ためし解き」で確認する）。
//      ここがやるのは「指された手のとおりに盤を動かす」こと。

import { parseUsiMove, usiSquareToIdx, RANK_LABELS } from './tsume'

export type Side = 'b' | 'w'

/** 盤の1マス。letter は大文字の駒種（P/L/N/S/G/B/R/K）。black=攻め方(先手) */
export type Square = { letter: string; promoted: boolean; black: boolean } | null

export type Position = {
  /** 81マス。index = 段(0=一,上) * 9 + 位置(0=9筋,左)。tsume.ts の cells と同じ並び */
  board: Square[]
  /** 攻め方(先手)の持ち駒。大文字letter → 枚数 */
  blackHand: Record<string, number>
  /** 玉方(後手)の持ち駒 */
  whiteHand: Record<string, number>
  turn: Side
  moveNum: number
}

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
const FW_DIGIT: Record<string, string> = {
  '1': '１',
  '2': '２',
  '3': '３',
  '4': '４',
  '5': '５',
  '6': '６',
  '7': '７',
  '8': '８',
  '9': '９'
}
/** SFEN の持ち駒の並び順（飛・角・金・銀・桂・香・歩） */
const HAND_ORDER = ['R', 'B', 'G', 'S', 'N', 'L', 'P']
/** 打てる（持ち駒になる）駒 */
export const DROPPABLE = ['R', 'B', 'G', 'S', 'N', 'L', 'P'] as const
/** 成れる駒 */
const PROMOTABLE = new Set(['P', 'L', 'N', 'S', 'B', 'R'])

export function emptyPosition(): Position {
  return {
    board: Array(81).fill(null),
    blackHand: {},
    whiteHand: {},
    turn: 'b',
    moveNum: 1
  }
}

/** SFEN 文字列 → Position（駒の記号・持ち駒・手番・手数を保持） */
export function parseSfenFull(sfen: string): Position {
  const parts = sfen.trim().split(/\s+/)
  const position = parts[0] ?? ''
  const turn = (parts[1] as Side) === 'w' ? 'w' : 'b'
  const hands = parts[2] ?? '-'
  const moveNum = parseInt(parts[3] ?? '1', 10) || 1

  const board: Square[] = []
  for (const rank of position.split('/')) {
    let promoted = false
    for (const ch of rank) {
      if (ch === '+') {
        promoted = true
        continue
      }
      if (ch >= '0' && ch <= '9') {
        const n = parseInt(ch, 10)
        for (let i = 0; i < n; i++) board.push(null)
        continue
      }
      const black = ch === ch.toUpperCase()
      board.push({ letter: ch.toUpperCase(), promoted, black })
      promoted = false
    }
  }
  while (board.length < 81) board.push(null)

  const blackHand: Record<string, number> = {}
  const whiteHand: Record<string, number> = {}
  if (hands && hands !== '-') {
    let i = 0
    while (i < hands.length) {
      let count = 0
      while (i < hands.length && hands[i] >= '0' && hands[i] <= '9') {
        count = count * 10 + parseInt(hands[i], 10)
        i++
      }
      const ch = hands[i]
      i++
      if (!ch) break
      const black = ch === ch.toUpperCase()
      const target = black ? blackHand : whiteHand
      target[ch.toUpperCase()] = (target[ch.toUpperCase()] ?? 0) + (count || 1)
    }
  }

  return { board, blackHand, whiteHand, turn, moveNum }
}

/** Position → SFEN 文字列 */
export function positionToSfen(pos: Position): string {
  const rows: string[] = []
  for (let r = 0; r < 9; r++) {
    let row = ''
    let empty = 0
    for (let c = 0; c < 9; c++) {
      const cell = pos.board[r * 9 + c]
      if (!cell) {
        empty++
        continue
      }
      if (empty > 0) {
        row += String(empty)
        empty = 0
      }
      const ch = cell.black ? cell.letter : cell.letter.toLowerCase()
      row += (cell.promoted ? '+' : '') + ch
    }
    if (empty > 0) row += String(empty)
    rows.push(row)
  }
  const position = rows.join('/')

  let hands = ''
  for (const letter of HAND_ORDER) {
    const n = pos.blackHand[letter] ?? 0
    if (n > 0) hands += (n > 1 ? String(n) : '') + letter
  }
  for (const letter of HAND_ORDER) {
    const n = pos.whiteHand[letter] ?? 0
    if (n > 0) hands += (n > 1 ? String(n) : '') + letter.toLowerCase()
  }
  if (hands === '') hands = '-'

  return `${position} ${pos.turn} ${hands} ${pos.moveNum}`
}

function cloneHand(h: Record<string, number>): Record<string, number> {
  return { ...h }
}

/** 指し手(USI)を盤に反映した新しい Position と、日本語表記を返す（不正な手は例外） */
export function applyUsiMove(pos: Position, usi: string): { pos: Position; moveJa: string } {
  const move = parseUsiMove(usi)
  const board = pos.board.slice()
  const blackHand = cloneHand(pos.blackHand)
  const whiteHand = cloneHand(pos.whiteHand)
  const black = pos.turn === 'b'
  const myHand = black ? blackHand : whiteHand

  const mark = black ? '▲' : '△'
  const fileNum = FW_DIGIT[String(9 - (move.toIdx % 9))]
  const rankKanji = RANK_LABELS[Math.floor(move.toIdx / 9)]
  let pieceName = ''

  if (move.drop) {
    // 持ち駒を打つ
    const letter = move.drop.toUpperCase()
    if ((myHand[letter] ?? 0) <= 0) {
      throw new Error(`持ち駒に ${BASE_KANJI[letter] ?? letter} がありません`)
    }
    myHand[letter] -= 1
    if (myHand[letter] <= 0) delete myHand[letter]
    board[move.toIdx] = { letter, promoted: false, black }
    pieceName = (BASE_KANJI[letter] ?? letter) + '打'
  } else {
    // 盤上の駒を動かす
    if (move.fromIdx === null) throw new Error('動かす駒の位置が不正です')
    const piece = board[move.fromIdx]
    if (!piece) throw new Error('そのマスに駒がありません')

    // 取り（行き先に相手の駒）→ 自分の持ち駒へ（成りは外して元の駒に戻す）
    const captured = board[move.toIdx]
    if (captured) {
      const base = captured.letter.toUpperCase()
      if (base !== 'K') {
        myHand[base] = (myHand[base] ?? 0) + 1
      }
    }

    const willPromote = move.promo || piece.promoted
    board[move.fromIdx] = null
    board[move.toIdx] = { letter: piece.letter, promoted: willPromote, black: piece.black }

    if (piece.letter === 'K') {
      pieceName = '玉'
    } else if (piece.promoted) {
      pieceName = PROM_KANJI[piece.letter] ?? piece.letter
    } else {
      pieceName = (BASE_KANJI[piece.letter] ?? piece.letter) + (move.promo ? '成' : '')
    }
  }

  const next: Position = {
    board,
    blackHand,
    whiteHand,
    turn: black ? 'w' : 'b',
    moveNum: pos.moveNum + 1
  }
  return { pos: next, moveJa: `${mark}${fileNum}${rankKanji}${pieceName}` }
}

export type BuildFramesResult =
  | { ok: true; frames: string[]; movesJa: string[]; finalSfen: string }
  | { ok: false; error: string }

/** 開始局面(SFEN) + 手順(USI配列) → frames / movesJa / finalSfen をまとめて生成 */
export function buildFrames(startSfen: string, movesUsi: string[]): BuildFramesResult {
  try {
    let pos = parseSfenFull(startSfen)
    const frames = [positionToSfen(pos)]
    const movesJa: string[] = []
    for (const usi of movesUsi) {
      const r = applyUsiMove(pos, usi)
      pos = r.pos
      movesJa.push(r.moveJa)
      frames.push(positionToSfen(pos))
    }
    return { ok: true, frames, movesJa, finalSfen: frames[frames.length - 1] }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

// ───────────────────── 成りの判定（エディタの操作用） ─────────────────────

const ZONE_BLACK = new Set([0, 1, 2]) // 先手の成りゾーン（一二三段）
const ZONE_WHITE = new Set([6, 7, 8]) // 後手の成りゾーン（七八九段）

function inPromoZone(black: boolean, idx: number): boolean {
  const rank = Math.floor(idx / 9)
  return black ? ZONE_BLACK.has(rank) : ZONE_WHITE.has(rank)
}

/** 駒を from→to に動かしたとき、成りが「不可 / 任意 / 強制」のどれか */
export function promotionState(
  piece: { letter: string; promoted: boolean; black: boolean },
  fromIdx: number,
  toIdx: number
): 'none' | 'optional' | 'forced' {
  if (piece.promoted) return 'none'
  if (!PROMOTABLE.has(piece.letter)) return 'none'
  const enters = inPromoZone(piece.black, fromIdx) || inPromoZone(piece.black, toIdx)
  if (!enters) return 'none'

  const rank = Math.floor(toIdx / 9)
  // 歩・香は最終段、桂は最終2段では必ず成る（動けなくなるため）
  if (piece.letter === 'P' || piece.letter === 'L') {
    if ((piece.black && rank === 0) || (!piece.black && rank === 8)) return 'forced'
  }
  if (piece.letter === 'N') {
    if ((piece.black && rank <= 1) || (!piece.black && rank >= 7)) return 'forced'
  }
  return 'optional'
}

/** USI のマス → index（再エクスポート：エディタで使う） */
export { usiSquareToIdx }

/** index → USI のマス表記（例: "5b"）。打ち/指し手の USI 組み立て用 */
export function idxToUsiSquare(idx: number): string {
  const file = 9 - (idx % 9)
  const rankLetter = String.fromCharCode('a'.charCodeAt(0) + Math.floor(idx / 9))
  return `${file}${rankLetter}`
}
