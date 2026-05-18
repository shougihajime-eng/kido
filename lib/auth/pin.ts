/**
 * 名前 + 4桁合言葉ログインの内部仕様
 *
 * - 4桁の合言葉は数字のみ（覚えやすさ優先）
 * - そのままだと Supabase Auth の最低6文字を満たさないので接頭辞・接尾辞をつけて膨らませる
 * - 接頭辞は固定だが、ピン総当たり攻撃を遅らせるための Pepper（環境変数）も足す
 *   ※ Pepper が無くても動くが、本番では NEXT_INTERNAL_AUTH_PEPPER を設定推奨
 */

const PIN_REGEX = /^\d{4}$/
const NAME_MAX = 40

export const PIN_LENGTH = 4

export function isValidPin(pin: string): boolean {
  return PIN_REGEX.test(pin)
}

export function validateDisplayName(name: string): { ok: true; name: string } | { ok: false; error: string } {
  const trimmed = name.trim()
  if (!trimmed) return { ok: false, error: 'なまえを入れてください' }
  if (trimmed.length > NAME_MAX) {
    return { ok: false, error: `なまえは${NAME_MAX}文字以内にしてください` }
  }
  // メールアドレスっぽい入力はミスとして弾く
  if (trimmed.includes('@')) {
    return { ok: false, error: 'なまえに @ は使えません' }
  }
  return { ok: true, name: trimmed }
}

/** PIN → Supabase Auth のパスワードに変換 */
export function pinToPassword(pin: string): string {
  if (!isValidPin(pin)) {
    throw new Error('Invalid PIN format')
  }
  const pepper = process.env.NEXT_INTERNAL_AUTH_PEPPER ?? 'kido-pin-v1'
  return `${pepper}#${pin}#kido`
}

/** 新規ユーザー用に内部メアドを生成（衝突回避のために UUID をそのまま使う） */
export function makeSyntheticEmail(): string {
  // crypto.randomUUID は Node 19+ / Edge / Browser で利用可
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36)
  return `${id}@kido.local`
}
