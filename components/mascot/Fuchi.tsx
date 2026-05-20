// 棋道のマスコット「ふっち」
//   - 歩兵（ふ）の駒に小さい目をつけたシンプルなキャラ
//   - シリアスな世界観を壊さないよう、墨色＋金縁の落ち着いた配色
//   - ストリーク警告など、生徒が「ちょっと笑える」場面でこっそり登場
//
// 使い方:
//   <Fuchi size={48} mood="cheer" />
//   <FuchiBubble text="今日まだ記録してないよ〜" />

type Mood = 'normal' | 'cheer' | 'sleepy' | 'worry'

interface FuchiProps {
  /** SVG の大きさ（px）。既定 48 */
  size?: number
  /** 表情の種類 */
  mood?: Mood
  /** 追加クラス */
  className?: string
}

export function Fuchi({ size = 48, mood = 'normal', className }: FuchiProps) {
  // 駒の中の目の表現を mood で切り替え
  const eyes = (() => {
    switch (mood) {
      case 'cheer':
        // (^^) 笑顔
        return (
          <>
            <path d="M11 21 q1.5 -2 3 0" stroke="#fff8e7" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M19 21 q1.5 -2 3 0" stroke="#fff8e7" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          </>
        )
      case 'sleepy':
        // 半目（眠い）
        return (
          <>
            <line x1="11" y1="22" x2="14" y2="22" stroke="#fff8e7" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="19" y1="22" x2="22" y2="22" stroke="#fff8e7" strokeWidth="1.4" strokeLinecap="round" />
          </>
        )
      case 'worry':
        // /\ 困り顔
        return (
          <>
            <path d="M11 23 q1.5 -2 3 0" stroke="#fff8e7" strokeWidth="1.2" fill="none" strokeLinecap="round" transform="rotate(180 12.5 22.5)" />
            <path d="M19 23 q1.5 -2 3 0" stroke="#fff8e7" strokeWidth="1.2" fill="none" strokeLinecap="round" transform="rotate(180 20.5 22.5)" />
          </>
        )
      case 'normal':
      default:
        // 点目
        return (
          <>
            <circle cx="12.5" cy="22" r="1.1" fill="#fff8e7" />
            <circle cx="20.5" cy="22" r="1.1" fill="#fff8e7" />
          </>
        )
    }
  })()

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 33 36"
      aria-label="ふっち"
      className={className}
    >
      {/* 駒の影 */}
      <ellipse cx="16.5" cy="34" rx="9" ry="1.2" fill="rgba(0,0,0,0.12)" />

      {/* 駒の本体（将棋駒の五角形） */}
      <path
        d="M16.5 2 L28 9 L26.5 32 L6.5 32 L5 9 Z"
        fill="#1f2937"
        stroke="#b8893a"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* 「歩」の文字（少し小さく、上半分に） */}
      <text
        x="16.5"
        y="17"
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fill="#fff8e7"
        fontFamily="serif"
      >
        歩
      </text>

      {/* 目（下半分） */}
      {eyes}
    </svg>
  )
}

interface FuchiBubbleProps {
  /** ふっちのセリフ */
  text: string
  /** ふっちの表情 */
  mood?: Mood
  /** 追加クラス（外側 div に付く） */
  className?: string
}

/**
 * ふっち＋ふきだし のセット。
 * 「今日まだ記録してないよ〜」みたいに、ふっちが優しく語りかける場面に使う。
 */
export function FuchiBubble({ text, mood = 'normal', className }: FuchiBubbleProps) {
  return (
    <div className={`flex items-end gap-2 ${className ?? ''}`}>
      <Fuchi size={44} mood={mood} className="shrink-0" />
      <div className="relative bg-surface-elevated border border-border rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-text-muted leading-relaxed max-w-[240px]">
        {/* 三角の吹き出ししっぽ */}
        <span
          aria-hidden
          className="absolute -left-1.5 bottom-2 w-3 h-3 rotate-45 bg-surface-elevated border-l border-b border-border"
        />
        <span className="relative">{text}</span>
      </div>
    </div>
  )
}
