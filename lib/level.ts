/**
 * 棋力（段級）の表示用ヘルパー
 * profiles.level_kind と profiles.level_text を組み合わせて
 * ランキング・プロフィール・見守り画面で表示する文字列を作る。
 *
 * 並び順: アマチュアを上に置き、奨励会員・女流棋士・研修会員はその下に。
 * 旧 'amateur' は表示用にだけ後方互換で残し、SELECT には出さない。
 */

// SELECT に出す表示用カテゴリ（並び順 = 表示順）
export const LEVEL_KIND_VALUES = [
  'amateur_dan',
  'amateur_kyu',
  'shoreikai',
  'joryu',
  'kenshukai',
  'other',
  'none'
] as const

export type LevelKind = (typeof LEVEL_KIND_VALUES)[number]

// 旧データ後方互換: DB に 'amateur' が残っていても表示できるようにする
export type AnyLevelKind = LevelKind | 'amateur'

export const LEVEL_KIND_LABEL: Record<LevelKind, string> = {
  amateur_dan: 'アマチュア（段位）',
  amateur_kyu: 'アマチュア（級位）',
  shoreikai: '奨励会員',
  joryu: '女流棋士',
  kenshukai: '研修会員',
  other: 'その他',
  none: 'まだ無し'
}

// 表示用 短いラベル（ランキング・プロフィール）
const LEVEL_KIND_SHORT_ALL: Record<AnyLevelKind, string> = {
  amateur_dan: 'アマ',
  amateur_kyu: 'アマ',
  amateur: 'アマ', // 旧データ互換
  shoreikai: '奨励会',
  joryu: '女流',
  kenshukai: '研修会',
  other: '',
  none: ''
}

export const LEVEL_KIND_SHORT: Record<LevelKind, string> = {
  amateur_dan: LEVEL_KIND_SHORT_ALL.amateur_dan,
  amateur_kyu: LEVEL_KIND_SHORT_ALL.amateur_kyu,
  shoreikai: LEVEL_KIND_SHORT_ALL.shoreikai,
  joryu: LEVEL_KIND_SHORT_ALL.joryu,
  kenshukai: LEVEL_KIND_SHORT_ALL.kenshukai,
  other: LEVEL_KIND_SHORT_ALL.other,
  none: LEVEL_KIND_SHORT_ALL.none
}

export const LEVEL_KIND_PLACEHOLDER: Record<LevelKind, string> = {
  amateur_dan: '例：三段、四段、五段',
  amateur_kyu: '例：1級、3級、5級',
  shoreikai: '例：三段 / 1級 / 6級',
  joryu: '例：1級 / 2段',
  kenshukai: '例：B1 / A2 / C2',
  other: '例：プロ四段',
  none: ''
}

// 後方互換も含めた判定（DB 由来の値チェックに使う）
const ALL_LEVEL_KINDS: readonly AnyLevelKind[] = [
  ...LEVEL_KIND_VALUES,
  'amateur'
] as const

export function isValidLevelKind(value: unknown): value is LevelKind {
  return (
    typeof value === 'string' &&
    (LEVEL_KIND_VALUES as readonly string[]).includes(value)
  )
}

function isAnyLevelKind(value: unknown): value is AnyLevelKind {
  return (
    typeof value === 'string' &&
    (ALL_LEVEL_KINDS as readonly string[]).includes(value)
  )
}

/**
 * 表示用文字列を組み立てる。
 * - level_kind が 'none' / null → '' を返す
 * - level_kind が 'other' → level_text のみ
 * - それ以外 → 「アマ 三段」のように short label + text
 * - 旧 'amateur' データも 'アマ' として表示できる（後方互換）
 */
export function formatLevel(
  levelKind: string | null | undefined,
  levelText: string | null | undefined
): string {
  if (!levelKind || levelKind === 'none') return ''
  const short = isAnyLevelKind(levelKind) ? LEVEL_KIND_SHORT_ALL[levelKind] : ''
  const text = (levelText ?? '').trim()
  if (!short) return text
  if (!text) return short
  return `${short} ${text}`
}
