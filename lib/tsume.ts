// 詰将棋「今日の名作」コーナーのデータ＆盤面ユーティリティ
//
// ■ 大事な前提（はじめさんへ）
//   詰将棋は駒が1マスでもズレると問題が壊れる（詰まない／答えが複数になる）。
//   なので、ここに入れる問題はすべて scripts/tsume_solver.py で
//   「開始局面で玉に王手がかかっていない」「本当に詰む」「何手詰か」を
//   機械でチェックしてから登録する。記憶頼みで並べない。
//
//   いま入っているのは “動作確認用（おためし）” のやさしい1手詰だけ。
//   本物の名作（将棋図巧・将棋無双 等、著作権切れの古典）は、信頼できる
//   棋譜データから取り込み → ソルバーで検証 → ここに追記していく。

export type TsumeLevel = 'demo' | 'easy' | 'normal' | 'hard' | 'master'

export type TsumeProblem = {
  id: string
  /** 手数（3手詰なら 3）。1問1問ソルバーで確定した値 */
  tesuu: number
  /** 開始局面（先手＝攻め方の手番）。SFEN 形式 */
  startSfen: string
  /** 詰み上がりの局面。SFEN 形式 */
  finalSfen: string
  /** 正解手順の日本語表記（例：▲５二金打） */
  movesJa: string[]
  /** 正解手順の USI 表記（指で動かす照合用）。movesJa と同じ長さ */
  movesUsi: string[]
  /** 各手後の局面（SFEN）。長さ = tesuu + 1（[0]=開始, [last]=詰み上がり） */
  frames: string[]
  level: TsumeLevel
  title?: string
  /** 作者（古典名作のとき） */
  composer?: string
  /** 出どころ（例：将棋図巧 第1番／コンピューター作成・検証済み）。子どもへの安心表示にも使う */
  source?: string
  /** ひとこと解説 */
  note?: string
}

// すべて scripts/generate_tsume.py が自動生成 → scripts/tsume_solver.py で
// 「開始王手なし・指定手数で詰む・答えが一通り（余詰なし）」を確認済み。
// frames は scripts で局面を1手ずつ進めて書き出した正確な盤面（指で解くのに使う）。
const SRC_GEN = 'コンピューター作成・検証済み'
export const TSUME: TsumeProblem[] = [
  {
    id: 'gen-5',
    tesuu: 5,
    level: 'normal',
    source: SRC_GEN,
    startSfen: '9/9/7k1/5BS2/9/5B3/9/9/1K7 b - 1',
    finalSfen: '7k1/7+S1/6+B2/9/9/5B3/9/9/1K7 w - 6',
    movesJa: ['▲３三角成', '△１二玉', '▲２三銀', '△２一玉', '▲２二銀成'],
    movesUsi: ['4d3c+', '2c1b', '3d2c', '1b2a', '2c2b+'],
    frames: [
      '9/9/7k1/5BS2/9/5B3/9/9/1K7 b - 1',
      '9/9/6+Bk1/6S2/9/5B3/9/9/1K7 w - 2',
      '9/8k/6+B2/6S2/9/5B3/9/9/1K7 b - 3',
      '9/8k/6+BS1/9/9/5B3/9/9/1K7 w - 4',
      '7k1/9/6+BS1/9/9/5B3/9/9/1K7 b - 5',
      '7k1/7+S1/6+B2/9/9/5B3/9/9/1K7 w - 6'
    ]
  },
  {
    id: 'gen-1',
    tesuu: 3,
    level: 'easy',
    source: SRC_GEN,
    startSfen: '9/9/k8/9/9/GSR6/9/9/8K b GS 1',
    finalSfen: '9/kG7/2+R6/9/9/GS7/9/9/8K w S 4',
    movesJa: ['▲７三飛成', '△９二玉', '▲８二金打'],
    movesUsi: ['7f7c+', '9c9b', 'G*8b'],
    frames: [
      '9/9/k8/9/9/GSR6/9/9/8K b GS 1',
      '9/9/k1+R6/9/9/GS7/9/9/8K w GS 2',
      '9/k8/2+R6/9/9/GS7/9/9/8K b GS 3',
      '9/kG7/2+R6/9/9/GS7/9/9/8K w S 4'
    ]
  },
  {
    id: 'gen-6',
    tesuu: 5,
    level: 'normal',
    source: SRC_GEN,
    startSfen: '9/9/kN7/2G6/B8/9/9/9/K8 b GL 1',
    finalSfen: 'G8/1k7/1NG6/1B7/9/9/9/9/K8 w L 6',
    movesJa: ['▲８四角', '△９二玉', '▲９一金打', '△８二玉', '▲７三金'],
    movesUsi: ['9e8d', '9c9b', 'G*9a', '9b8b', '7d7c'],
    frames: [
      '9/9/kN7/2G6/B8/9/9/9/K8 b GL 1',
      '9/9/kN7/1BG6/9/9/9/9/K8 w GL 2',
      '9/k8/1N7/1BG6/9/9/9/9/K8 b GL 3',
      'G8/k8/1N7/1BG6/9/9/9/9/K8 w L 4',
      'G8/1k7/1N7/1BG6/9/9/9/9/K8 b L 5',
      'G8/1k7/1NG6/1B7/9/9/9/9/K8 w L 6'
    ]
  },
  {
    id: 'gen-2',
    tesuu: 3,
    level: 'easy',
    source: SRC_GEN,
    startSfen: '4k1G2/9/6R2/4B4/9/9/9/9/K8 b SN 1',
    finalSfen: '3k2G2/2S6/4+R4/4B4/9/9/9/9/K8 w N 4',
    movesJa: ['▲５三飛成', '△６一玉', '▲７二銀打'],
    movesUsi: ['3c5c+', '5a6a', 'S*7b'],
    frames: [
      '4k1G2/9/6R2/4B4/9/9/9/9/K8 b SN 1',
      '4k1G2/9/4+R4/4B4/9/9/9/9/K8 w SN 2',
      '3k2G2/9/4+R4/4B4/9/9/9/9/K8 b SN 3',
      '3k2G2/2S6/4+R4/4B4/9/9/9/9/K8 w N 4'
    ]
  },
  {
    id: 'gen-7',
    tesuu: 5,
    level: 'normal',
    source: SRC_GEN,
    startSfen: '9/9/8k/6G2/6G2/9/9/K8/9 b G 1',
    finalSfen: '6k2/6G2/6G2/7G1/9/9/9/K8/9 w - 6',
    movesJa: ['▲２四金', '△２二玉', '▲３三金', '△３一玉', '▲３二金打'],
    movesUsi: ['3e2d', '1c2b', '3d3c', '2b3a', 'G*3b'],
    frames: [
      '9/9/8k/6G2/6G2/9/9/K8/9 b G 1',
      '9/9/8k/6GG1/9/9/9/K8/9 w G 2',
      '9/7k1/9/6GG1/9/9/9/K8/9 b G 3',
      '9/7k1/6G2/7G1/9/9/9/K8/9 w G 4',
      '6k2/9/6G2/7G1/9/9/9/K8/9 b G 5',
      '6k2/6G2/6G2/7G1/9/9/9/K8/9 w - 6'
    ]
  },
  {
    id: 'gen-3',
    tesuu: 3,
    level: 'easy',
    source: SRC_GEN,
    startSfen: 'k8/1L7/9/1G7/9/9/9/9/8K b GS 1',
    finalSfen: '1G7/kL7/S8/1G7/9/9/9/9/8K w - 4',
    movesJa: ['▲８一金打', '△９二玉', '▲９三銀打'],
    movesUsi: ['G*8a', '9a9b', 'S*9c'],
    frames: [
      'k8/1L7/9/1G7/9/9/9/9/8K b GS 1',
      'kG7/1L7/9/1G7/9/9/9/9/8K w S 2',
      '1G7/kL7/9/1G7/9/9/9/9/8K b S 3',
      '1G7/kL7/S8/1G7/9/9/9/9/8K w - 4'
    ]
  },
  {
    id: 'gen-8',
    tesuu: 5,
    level: 'normal',
    source: SRC_GEN,
    startSfen: '9/6k2/8G/9/4R2R1/9/9/9/8K b - 1',
    finalSfen: '4R1k2/9/5+R2G/9/9/9/9/9/8K w - 6',
    movesJa: ['▲２三飛成', '△４一玉', '▲４三龍', '△３一玉', '▲５一飛'],
    movesUsi: ['2e2c+', '3b4a', '2c4c', '4a3a', '5e5a'],
    frames: [
      '9/6k2/8G/9/4R2R1/9/9/9/8K b - 1',
      '9/6k2/7+RG/9/4R4/9/9/9/8K w - 2',
      '5k3/9/7+RG/9/4R4/9/9/9/8K b - 3',
      '5k3/9/5+R2G/9/4R4/9/9/9/8K w - 4',
      '6k2/9/5+R2G/9/4R4/9/9/9/8K b - 5',
      '4R1k2/9/5+R2G/9/9/9/9/9/8K w - 6'
    ]
  },
  {
    id: 'gen-4',
    tesuu: 3,
    level: 'easy',
    source: SRC_GEN,
    startSfen: '9/k8/2G6/9/9/9/9/9/8K b GN 1',
    finalSfen: 'k8/1G7/2G6/9/9/9/9/9/8K w N 4',
    movesJa: ['▲８三金打', '△９一玉', '▲８二金'],
    movesUsi: ['G*8c', '9b9a', '8c8b'],
    frames: [
      '9/k8/2G6/9/9/9/9/9/8K b GN 1',
      '9/k8/1GG6/9/9/9/9/9/8K w N 2',
      'k8/9/1GG6/9/9/9/9/9/8K b N 3',
      'k8/1G7/2G6/9/9/9/9/9/8K w N 4'
    ]
  },
  {
    id: 'gen-9',
    tesuu: 5,
    level: 'normal',
    source: SRC_GEN,
    startSfen: '9/7k1/5N3/7G1/6G2/9/9/9/K8 b GN 1',
    finalSfen: '5k3/5+N3/5NG2/7G1/6G2/9/9/9/K8 w - 6',
    movesJa: ['▲３四桂打', '△３二玉', '▲３三金打', '△４一玉', '▲４二桂成'],
    movesUsi: ['N*3d', '2b3b', 'G*3c', '3b4a', '3d4b+'],
    frames: [
      '9/7k1/5N3/7G1/6G2/9/9/9/K8 b GN 1',
      '9/7k1/5N3/6NG1/6G2/9/9/9/K8 w G 2',
      '9/6k2/5N3/6NG1/6G2/9/9/9/K8 b G 3',
      '9/6k2/5NG2/6NG1/6G2/9/9/9/K8 w - 4',
      '5k3/9/5NG2/6NG1/6G2/9/9/9/K8 b - 5',
      '5k3/5+N3/5NG2/7G1/6G2/9/9/9/K8 w - 6'
    ]
  }
]

// 「今日の一問」を日付で決める（同じ日は同じ問題、日が変われば変わる）
export function todayTsumeIndex(dateISO: string): number {
  return dailyIndex(dateISO, TSUME.length)
}

// 日付 → 0..len-1 の番号（同じ日は同じ、日が変われば変わる）。
// DB から読み込んだ問題リストの長さに合わせて使う。
export function dailyIndex(dateISO: string, len: number): number {
  if (len <= 0) return 0
  const seed = parseInt(dateISO.split('-').join(''), 10) || 0
  return seed % len
}

// データベースの1行（snake_case）を TsumeProblem（camelCase）に変換する。
// 生徒・保護者の画面、先生のプレビューで使う。
export type TsumeRow = {
  id: string
  tesuu: number
  level: string
  start_sfen: string
  final_sfen: string
  moves_ja: string[] | null
  moves_usi: string[] | null
  frames: string[] | null
  title: string | null
  composer: string | null
  source: string | null
  note: string | null
}

export function rowToTsume(row: TsumeRow): TsumeProblem {
  return {
    id: row.id,
    tesuu: row.tesuu,
    level: (['demo', 'easy', 'normal', 'hard', 'master'].includes(row.level)
      ? row.level
      : 'normal') as TsumeLevel,
    startSfen: row.start_sfen,
    finalSfen: row.final_sfen,
    movesJa: row.moves_ja ?? [],
    movesUsi: row.moves_usi ?? [],
    frames: row.frames ?? [row.start_sfen],
    title: row.title ?? undefined,
    composer: row.composer ?? undefined,
    source: row.source ?? undefined,
    note: row.note ?? undefined
  }
}

// 「次の問題」：直前と同じを避けてランダムに1問
export function pickNextTsume(currentIndex: number | null): number {
  if (TSUME.length <= 1) return 0
  let next = Math.floor(Math.random() * TSUME.length)
  if (next === currentIndex) next = (next + 1) % TSUME.length
  return next
}

export const LEVEL_BADGE: Record<TsumeLevel, { label: string; bgClass: string; textClass: string }> = {
  demo: { label: 'おためし', bgClass: 'bg-surface-elevated', textClass: 'text-text-muted' },
  easy: { label: 'やさしい', bgClass: 'bg-sakura-soft', textClass: 'text-sakura' },
  normal: { label: 'ふつう', bgClass: 'bg-accent-soft', textClass: 'text-accent' },
  hard: { label: '手ごわい', bgClass: 'bg-gold-soft', textClass: 'text-gold-deep' },
  master: { label: '名人級', bgClass: 'bg-fire/10', textClass: 'text-fire' }
}

// ───────────────────── SFEN → 盤面の読み取り ─────────────────────
// 盤を描くための純粋関数。記憶ではなく SFEN 文字列から機械的に組み立てる。

export type BoardPiece = { kanji: string; black: boolean; promoted: boolean }
export type HandPiece = { kanji: string; black: boolean; count: number; letter: string }

const BASE_KANJI: Record<string, string> = {
  P: '歩',
  L: '香',
  N: '桂',
  S: '銀',
  G: '金',
  B: '角',
  R: '飛'
}
const PROM_KANJI: Record<string, string> = {
  P: 'と',
  L: '杏',
  N: '圭',
  S: '全',
  B: '馬',
  R: '龍'
}

function letterToKanji(letter: string, promoted: boolean): string {
  const upper = letter.toUpperCase()
  const black = letter === upper
  if (upper === 'K') return black ? '玉' : '王'
  if (promoted) return PROM_KANJI[upper] ?? upper
  return BASE_KANJI[upper] ?? upper
}

export type ParsedBoard = {
  /** 81マス。index = 段(0=一,上) * 9 + 筋位置(0=9筋,左) 。空マスは null */
  cells: (BoardPiece | null)[]
  /** 攻め方（先手）の持ち駒 */
  blackHand: HandPiece[]
  /** 玉方（後手）の持ち駒 */
  whiteHand: HandPiece[]
}

export function parseSfen(sfen: string): ParsedBoard {
  const parts = sfen.trim().split(/\s+/)
  const position = parts[0] ?? ''
  const hands = parts[2] ?? '-'

  const cells: (BoardPiece | null)[] = []
  for (const rank of position.split('/')) {
    let promoted = false
    for (const ch of rank) {
      if (ch === '+') {
        promoted = true
        continue
      }
      if (ch >= '0' && ch <= '9') {
        const n = parseInt(ch, 10)
        for (let i = 0; i < n; i++) cells.push(null)
        continue
      }
      const black = ch === ch.toUpperCase()
      cells.push({ kanji: letterToKanji(ch, promoted), black, promoted })
      promoted = false
    }
  }

  const blackHand: HandPiece[] = []
  const whiteHand: HandPiece[] = []
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
      const piece: HandPiece = {
        kanji: letterToKanji(ch, false),
        black,
        count: count || 1,
        letter: ch.toUpperCase()
      }
      ;(black ? blackHand : whiteHand).push(piece)
    }
  }

  return { cells, blackHand, whiteHand }
}

export const FILE_LABELS = ['9', '8', '7', '6', '5', '4', '3', '2', '1']
export const RANK_LABELS = ['一', '二', '三', '四', '五', '六', '七', '八', '九']

// ───────────────────── USI（指し手の記号）の読み取り ─────────────────────
// 指で動かしたとき、正解の手(movesUsi)と照合するのに使う。
// マス番号は parseSfen の cells と同じ並び（index = 段*9 + (9-筋)）。

/** USIのマス表記（例 "5b"）→ 盤の index(0..80) */
export function usiSquareToIdx(square: string): number {
  const file = parseInt(square[0], 10)
  const rank = square.charCodeAt(1) - 'a'.charCodeAt(0)
  return rank * 9 + (9 - file)
}

export type UsiMove = {
  fromIdx: number | null // 駒を打つ手なら null
  toIdx: number
  drop: string | null // 打つ駒の記号（例 "G"）。盤上の駒を動かす手なら null
  promo: boolean
}

/** USIの指し手（例 "7g7f", "5c5b+", "G*5b"）を分解 */
export function parseUsiMove(usi: string): UsiMove {
  if (usi.includes('*')) {
    return { fromIdx: null, toIdx: usiSquareToIdx(usi.slice(2)), drop: usi[0], promo: false }
  }
  const promo = usi.endsWith('+')
  const core = promo ? usi.slice(0, -1) : usi
  return {
    fromIdx: usiSquareToIdx(core.slice(0, 2)),
    toIdx: usiSquareToIdx(core.slice(2, 4)),
    drop: null,
    promo
  }
}
