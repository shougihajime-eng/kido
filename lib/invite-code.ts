/** 招待コードの生成・整形ユーティリティ */

/**
 * 紛らわしい文字（I, O, 0, 1）を除いた英数字でランダム生成。
 * 8文字 = 32^8 ≒ 1.1兆通り。1人の有効コードは数件なので衝突確率は無視できる。
 */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 8

export function generateInviteCode(): string {
  // crypto があれば優先（暗号学的乱数）
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint8Array(CODE_LENGTH)
    crypto.getRandomValues(buf)
    let s = ''
    for (let i = 0; i < CODE_LENGTH; i++) {
      s += ALPHABET[buf[i] % ALPHABET.length]
    }
    return s
  }
  let s = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return s
}

/** 表示用に 4-4 で区切る（例: ABCD-1234） */
export function formatInviteCode(code: string): string {
  if (code.length !== 8) return code
  return `${code.slice(0, 4)}-${code.slice(4)}`
}

/** 入力からハイフン・空白を取り除き、大文字に正規化 */
export function normalizeInviteCode(input: string): string {
  return input
    .replace(/[\s-]/g, '')
    .toUpperCase()
    .slice(0, CODE_LENGTH)
}

export function isValidInviteCode(code: string): boolean {
  if (code.length !== CODE_LENGTH) return false
  for (const c of code) {
    if (!ALPHABET.includes(c)) return false
  }
  return true
}
