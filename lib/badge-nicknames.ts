// バッジのあだ名（公式バッジ名とは別に、親しみやすい呼び名を付ける）
//
// 方針:
//   - まだ取れていない子が見ても「遠い…」と感じない、温かい言葉を選ぶ
//   - 強い言葉（「廃人」「修羅」「鬼」「覇者」）は基本使わない
//   - 「やってない子が嫌な気持ちにならず、やる気になる」が最優先

export const BADGE_NICKNAME: Record<string, string> = {
  // ── 既存：達成型（高ハードル）──────────────────────────────
  streak_7: '毎日の人',
  streak_30: 'ひと月の人',
  streak_100: '百日続けた人',
  total_10h: '駆け出し研究家',
  total_100h: '将棋大好きさん',
  total_1000h: '千時間の旅人',
  tsume_50h: '詰将棋の達人',
  jissen_50h: '実戦の人',
  week_full: '皆勤の人',

  // ── 追加：優しい初心者向け ──────────────────────────────
  first_record: 'はじめの一歩',
  welcome: 'ようこそ',
  first_self_memo: '気持ちを書いた',
  comeback_7: 'おかえり',
  comeback_14: 'また会えたね',
  monthly_active_8: 'マイペース',
  morning_person: '朝の人',
  night_owl: '夜の人',
  linked_first_adult: 'ありがとう',
  personal_best_week: '自分新記録'
}

export function badgeNickname(id: string): string | null {
  return BADGE_NICKNAME[id] ?? null
}
