/**
 * 棋力（段級）の表示用ヘルパー
 * profiles.level_kind と profiles.level_text を組み合わせて
 * ランキング・プロフィール・見守り画面で表示する文字列を作る。
 */

export const LEVEL_KIND_VALUES = [
  'shoreikai',
  'joryu',
  'kenshukai',
  'amateur',
  'other',
  'none'
] as const

export type LevelKind = (typeof LEVEL_KIND_VALUES)[number]

export const LEVEL_KIND_LABEL: Record<LevelKind, string> = {
  shoreikai: '奨励会員',
  joryu: '女流棋士',
  kenshukai: '研修会員',
  amateur: 'アマチュア',
  other: 'その他',
  none: 'まだ無し'
}

export const LEVEL_KIND_SHORT: Record<LevelKind, string> = {
  shoreikai: '奨励会',
  joryu: '女流',
  kenshukai: '研修会',
  amateur: 'アマ',
  other: '',
  none: ''
}

export const LEVEL_KIND_PLACEHOLDER: Record<LevelKind, string> = {
  shoreikai: '例：三段 / 1級 / 6級',
  joryu: '例：1級 / 2段',
  kenshukai: '例：B1 / A2 / C2',
  amateur: '例：三段 / 5級',
  other: '例：プロ四段',
  none: ''
}

export function isValidLevelKind(value: unknown): value is LevelKind {
  return typeof value === 'string' && (LEVEL_KIND_VALUES as readonly string[]).includes(value)
}

/**
 * 表示用文字列を組み立てる。
 * - level_kind が 'none' / null → '' を返す
 * - level_kind が 'other' → level_text のみ
 * - それ以外 → 「奨励会 三段」のように short label + text
 */
export function formatLevel(
  levelKind: string | null | undefined,
  levelText: string | null | undefined
): string {
  if (!levelKind || levelKind === 'none') return ''
  const short = isValidLevelKind(levelKind) ? LEVEL_KIND_SHORT[levelKind] : ''
  const text = (levelText ?? '').trim()
  if (!short) return text
  if (!text) return short
  return `${short} ${text}`
}
