import Link from 'next/link'
import { ShareAppButton } from '@/components/ShareAppButton'

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <ValueProps />
      <StudentScreens />
      <AdultScreens />
      <ClosingCTA />
      <FooterNote />
    </main>
  )
}

/* =========================================================
 * 1. ヒーロー
 * =======================================================*/
function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* 桜の薄い背景グラデ */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 0%, rgba(236,72,153,0.10) 0%, rgba(236,72,153,0) 60%), radial-gradient(70% 60% at 100% 100%, rgba(30,64,175,0.08) 0%, rgba(30,64,175,0) 60%)'
        }}
      />
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 sm:pt-28 sm:pb-24 flex flex-col items-center text-center gap-6">
        <div className="text-3xl">🌸</div>
        <h1 className="text-7xl sm:text-8xl md:text-9xl font-bold gold-glow tracking-tight leading-none">
          棋道
        </h1>
        <div className="text-text-dim text-xs sm:text-sm tracking-[0.4em] uppercase font-num">
          KIDO
        </div>
        <p className="text-text-muted text-lg sm:text-2xl mt-2 max-w-2xl leading-relaxed">
          将棋を本気で楽しむ、
          <br className="sm:hidden" />
          すべての人の研鑽ノート
        </p>
        <p className="text-text-dim text-base sm:text-lg max-w-xl leading-relaxed">
          奨励会員・女流棋士志望・研修会員・<span className="text-accent font-semibold">アマチュア</span>。
          <br className="hidden sm:inline" />
          段位の人も、級位の人も、毎日の積み重ねを大事にする方へ。
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-4">
          <Link
            href="/signup"
            className="h-14 px-10 inline-flex items-center justify-center rounded-full bg-accent text-white font-semibold text-lg shadow-[0_4px_20px_rgba(30,64,175,0.25)] hover:bg-accent-deep hover:shadow-[0_8px_28px_rgba(30,64,175,0.35)] transition-all hover-lift"
          >
            はじめる
          </Link>
          <Link
            href="/login"
            className="h-14 px-10 inline-flex items-center justify-center rounded-full border-2 border-border-strong bg-surface text-text font-semibold text-lg hover:border-accent hover:text-accent transition-colors hover-lift"
          >
            ログイン
          </Link>
        </div>

        <div className="text-text-dim text-xs font-num tracking-wider mt-2">β · 開発中</div>
      </div>
    </section>
  )
}

/* =========================================================
 * 2. 3つの価値
 * =======================================================*/
function ValueProps() {
  const items = [
    {
      emoji: '📝',
      title: '毎日の研鑽を記録',
      body: '棋譜並べ・実戦・研究会・定跡…3ステップで1分で記録。'
    },
    {
      emoji: '🔥',
      title: '連続日数で習慣化',
      body: '休まず続けるほど炎が大きくなる。毎日開きたくなる仕掛け。'
    },
    {
      emoji: '🤝',
      title: '仲間と切磋琢磨',
      body: 'みんなのがんばりが見えるランキング。ライバルにも会える。競争が苦手な人はプライベートモードで。'
    }
  ]
  return (
    <section className="bg-surface border-y border-border">
      <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {items.map((it) => (
            <div
              key={it.title}
              className="flex flex-col gap-3 text-center md:text-left p-6 sm:p-8 rounded-2xl bg-surface-overlay border border-border card-shadow hover-lift"
            >
              <div className="text-4xl">{it.emoji}</div>
              <div className="text-xl sm:text-2xl font-bold text-text">{it.title}</div>
              <div className="text-text-muted leading-relaxed">{it.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* =========================================================
 * 3. 生徒さん用ページサンプル
 * =======================================================*/
function StudentScreens() {
  return (
    <section className="bg-background">
      <div className="max-w-6xl mx-auto px-6 py-20 sm:py-28">
        <SectionHeader
          accentColor="var(--accent)"
          eyebrow="STUDENT"
          title="生徒さん用ページサンプル"
          subtitle="毎日ひらきたくなる、シンプルで気持ちいい画面"
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mt-12 sm:mt-16">
          <PhoneMockup label="記録する">
            <ScreenRecord />
          </PhoneMockup>
          <PhoneMockup label="ダッシュボード">
            <ScreenDashboard />
          </PhoneMockup>
          <PhoneMockup label="カレンダー">
            <ScreenCalendar />
          </PhoneMockup>
          <PhoneMockup label="仲間ランキング">
            <ScreenRanking />
          </PhoneMockup>
        </div>
      </div>
    </section>
  )
}

/* =========================================================
 * 4. 親・先生用ページサンプル
 * =======================================================*/
function AdultScreens() {
  return (
    <section className="bg-surface border-y border-border">
      <div className="max-w-6xl mx-auto px-6 py-20 sm:py-28">
        {/* 「管理者専用」風の帯ヘッダー */}
        <div className="flex justify-center mb-10 sm:mb-14">
          <div
            className="inline-flex items-center gap-3 px-6 sm:px-10 py-3 sm:py-4 rounded-full text-white font-bold text-lg sm:text-2xl tracking-wide shadow-[0_8px_24px_rgba(184,137,58,0.35)]"
            style={{
              background: 'linear-gradient(135deg, #b8893a 0%, #d4a04d 100%)'
            }}
          >
            <span className="text-xl sm:text-2xl">🪪</span>
            親・先生用ページサンプル
          </div>
        </div>
        <p className="text-center text-text-muted text-base sm:text-lg max-w-2xl mx-auto -mt-6 mb-12">
          紐づけた生徒さんの記録・目標・コメントを、
          <br className="sm:hidden" />
          そっと見守れます
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <PhoneMockup label="生徒さん一覧" accent="gold">
            <ScreenFamilyList />
          </PhoneMockup>
          <PhoneMockup label="記録とコメント" accent="gold">
            <ScreenComments />
          </PhoneMockup>
          <PhoneMockup label="目標の進み具合" accent="gold">
            <ScreenGoals />
          </PhoneMockup>
        </div>
      </div>
    </section>
  )
}

/* =========================================================
 * 5. 最後のCTA
 * =======================================================*/
function ClosingCTA() {
  return (
    <section className="bg-background">
      <div className="max-w-3xl mx-auto px-6 py-20 sm:py-28 text-center flex flex-col items-center gap-6">
        <div className="text-3xl">🌸</div>
        <h2 className="text-4xl sm:text-5xl font-bold gold-glow tracking-tight">
          今日から、はじめよう
        </h2>
        <p className="text-text-muted text-lg sm:text-xl leading-relaxed max-w-xl">
          ふつうのノートでは続かなかった研鑽が、
          <br className="hidden sm:inline" />
          棋道なら毎日のちいさな楽しみになります。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-2">
          <Link
            href="/signup"
            className="h-14 px-12 inline-flex items-center justify-center rounded-full bg-accent text-white font-semibold text-lg shadow-[0_4px_20px_rgba(30,64,175,0.25)] hover:bg-accent-deep hover:shadow-[0_8px_28px_rgba(30,64,175,0.35)] transition-all hover-lift"
          >
            無料ではじめる
          </Link>
          <Link
            href="/login"
            className="h-14 px-12 inline-flex items-center justify-center rounded-full border-2 border-border-strong bg-surface text-text font-semibold text-lg hover:border-accent hover:text-accent transition-colors hover-lift"
          >
            ログイン
          </Link>
        </div>
        <div className="text-text-dim text-sm mt-4">完全無料・広告なし</div>

        {/* 共有ボタン（広めてもらう） */}
        <div className="mt-10 pt-10 border-t border-border w-full max-w-md flex flex-col items-center gap-3">
          <p className="text-sm text-text-muted">
            棋道を応援してくれるあなたへ
          </p>
          <ShareAppButton
            size="lg"
            label="お友達にすすめる"
            hint="お友達・お子さんの先生・将棋仲間にこのアプリを伝える"
          />
        </div>
      </div>
    </section>
  )
}

/* =========================================================
 * 6. フッターメモ
 * =======================================================*/
function FooterNote() {
  return (
    <footer className="bg-surface border-t border-border">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-text-dim text-sm">
        <div className="font-num tracking-wider">© 棋道 (KIDO) · β</div>
        <div className="flex gap-6">
          <Link href="/login" className="hover:text-accent transition-colors">
            ログイン
          </Link>
          <Link href="/signup" className="hover:text-accent transition-colors">
            はじめる
          </Link>
        </div>
      </div>
    </footer>
  )
}

/* =========================================================
 *  セクション見出し
 * =======================================================*/
function SectionHeader({
  eyebrow,
  title,
  subtitle,
  accentColor
}: {
  eyebrow: string
  title: string
  subtitle: string
  accentColor: string
}) {
  return (
    <div className="flex flex-col items-center text-center gap-3">
      <div
        className="text-xs sm:text-sm tracking-[0.4em] uppercase font-num font-semibold"
        style={{ color: accentColor }}
      >
        {eyebrow}
      </div>
      <h2 className="text-3xl sm:text-5xl font-bold text-text tracking-tight">{title}</h2>
      <p className="text-text-muted text-base sm:text-lg max-w-2xl">{subtitle}</p>
    </div>
  )
}

/* =========================================================
 *  スマホモックアップ枠
 * =======================================================*/
function PhoneMockup({
  children,
  label,
  accent = 'accent'
}: {
  children: React.ReactNode
  label: string
  accent?: 'accent' | 'gold'
}) {
  const ringColor = accent === 'gold' ? 'rgba(184,137,58,0.25)' : 'rgba(30,64,175,0.20)'
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative w-full max-w-[220px] aspect-[9/19] rounded-[36px] p-[10px] bg-[#0f172a] shadow-[0_30px_60px_-20px_rgba(15,23,42,0.35)]"
        style={{ boxShadow: `0 30px 60px -20px ${ringColor}, 0 8px 20px rgba(15,23,42,0.25)` }}
      >
        {/* 画面 */}
        <div className="relative w-full h-full rounded-[28px] overflow-hidden bg-background">
          {/* ノッチ */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full bg-[#0f172a] z-10" />
          {/* ステータスバー */}
          <div className="h-7" />
          <div className="px-3 pb-3 h-[calc(100%-1.75rem)] overflow-hidden">{children}</div>
        </div>
      </div>
      <div className="text-text text-sm sm:text-base font-semibold">{label}</div>
    </div>
  )
}

/* =========================================================
 *  画面サンプル：記録ウィザード
 * =======================================================*/
function ScreenRecord() {
  const cats = [
    { name: '棋譜', color: 'var(--cat-kifu)' },
    { name: '実戦', color: 'var(--cat-game)' },
    { name: '研究会', color: 'var(--cat-study)' },
    { name: 'VS', color: 'var(--cat-vs)' },
    { name: 'AI', color: 'var(--cat-ai)' },
    { name: '定跡', color: 'var(--cat-book)' },
    { name: 'その他', color: 'var(--cat-other)' }
  ]
  return (
    <div className="flex flex-col gap-2 text-[10px]">
      <div className="flex items-center justify-between">
        <div className="font-bold text-[11px]">今日は何の練習？</div>
        <div className="text-text-dim font-num">1/3</div>
      </div>
      <div className="h-1 rounded-full bg-border overflow-hidden">
        <div className="h-full w-1/3 bg-accent rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-1.5 mt-1">
        {cats.map((c) => (
          <div
            key={c.name}
            className="rounded-lg py-2 text-center text-white font-semibold"
            style={{ background: c.color }}
          >
            {c.name}
          </div>
        ))}
      </div>
    </div>
  )
}

/* =========================================================
 *  画面サンプル：ダッシュボード
 * =======================================================*/
function ScreenDashboard() {
  const bars = [40, 65, 30, 80, 55, 90, 70]
  const days = ['月', '火', '水', '木', '金', '土', '日']
  return (
    <div className="flex flex-col gap-2 text-[10px]">
      <div className="text-text-dim">今日の合計</div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold font-num gold-glow leading-none">120</span>
        <span className="text-text-muted">分</span>
      </div>
      <div className="flex items-center gap-1.5 mt-1 p-1.5 rounded-lg bg-[rgba(249,115,22,0.10)]">
        <span className="text-base">🔥</span>
        <span className="font-num font-bold text-fire text-sm">14</span>
        <span className="text-text-muted">日連続</span>
      </div>
      <div className="mt-1.5">
        <div className="text-text-dim mb-1">今週の練習時間</div>
        <div className="flex items-end justify-between gap-0.5 h-14">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className="w-full rounded-t bg-accent"
                style={{ height: `${h}%`, opacity: 0.4 + h / 200 }}
              />
              <div className="text-text-dim text-[8px]">{days[i]}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between p-1.5 rounded-lg bg-sakura-soft">
        <span className="text-sakura font-semibold">目標まで</span>
        <span className="font-num font-bold text-sakura">あと 30 分</span>
      </div>
    </div>
  )
}

/* =========================================================
 *  画面サンプル：カレンダー（ヒートマップ）
 * =======================================================*/
function ScreenCalendar() {
  // 7行 x 18列 のヒートマップ（疑似）
  const rows = 7
  const cols = 18
  const cells: number[] = []
  for (let i = 0; i < rows * cols; i++) {
    // ランダムっぽい固定パターン
    const n = (i * 37) % 5
    cells.push(n)
  }
  return (
    <div className="flex flex-col gap-2 text-[10px]">
      <div className="font-bold text-[11px]">6か月のがんばり</div>
      <div className="text-text-dim text-[9px]">毎日が小さな積み重ね</div>
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {cells.map((n, i) => (
          <div
            key={i}
            className="aspect-square rounded-[2px]"
            style={{
              background: n === 0 ? 'var(--border)' : 'var(--accent)',
              opacity: n === 0 ? 1 : 0.25 + n * 0.18
            }}
          />
        ))}
      </div>
      <div className="flex items-center justify-end gap-1 text-text-dim text-[9px]">
        <span>少</span>
        <div className="w-2 h-2 rounded-sm bg-border" />
        <div className="w-2 h-2 rounded-sm bg-accent" style={{ opacity: 0.35 }} />
        <div className="w-2 h-2 rounded-sm bg-accent" style={{ opacity: 0.6 }} />
        <div className="w-2 h-2 rounded-sm bg-accent" style={{ opacity: 0.85 }} />
        <span>多</span>
      </div>
      <div className="mt-1 p-2 rounded-lg bg-surface-overlay border border-border">
        <div className="text-text-dim text-[9px]">5月17日（水）</div>
        <div className="font-num font-bold text-text">85 分</div>
      </div>
    </div>
  )
}

/* =========================================================
 *  画面サンプル：仲間ランキング
 * =======================================================*/
function ScreenRanking() {
  const rows = [
    { rank: '🥇', name: 'ゆうま', mins: 540, me: false },
    { rank: '🥈', name: 'はじめ', mins: 480, me: true },
    { rank: '🥉', name: 'りく', mins: 410, me: false },
    { rank: '4', name: 'みさき', mins: 370, me: false },
    { rank: '5', name: 'けんた', mins: 305, me: false }
  ]
  return (
    <div className="flex flex-col gap-2 text-[10px]">
      <div className="font-bold text-[11px]">今週のランキング</div>
      <div className="text-text-dim text-[9px]">みんなのがんばりが見える</div>
      <div className="flex flex-col gap-1 mt-1">
        {rows.map((r) => (
          <div
            key={r.name}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg ${
              r.me ? 'bg-accent-soft border border-accent' : 'bg-surface border border-border'
            }`}
          >
            <span className="w-4 text-center font-num font-bold">{r.rank}</span>
            <span className="flex-1 truncate font-semibold">
              {r.name}
              {r.me && <span className="ml-1 text-accent text-[8px]">（あなた）</span>}
            </span>
            <span className="font-num text-text-muted">{r.mins}分</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* =========================================================
 *  画面サンプル：親・先生 生徒一覧
 * =======================================================*/
function ScreenFamilyList() {
  const students = [
    { name: 'はじめくん', subtitle: '今週 480分・🔥14日', tag: '子' },
    { name: 'ゆうまくん', subtitle: '今週 540分・🔥21日', tag: '生' },
    { name: 'みさきさん', subtitle: '今週 370分・🔥7日', tag: '生' }
  ]
  return (
    <div className="flex flex-col gap-2 text-[10px]">
      <div className="font-bold text-[11px]">うちの子・教え子</div>
      <div className="text-text-dim text-[9px]">タップで詳しく見られます</div>
      <div className="flex flex-col gap-1.5 mt-1">
        {students.map((s) => (
          <div
            key={s.name}
            className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-border"
          >
            <div className="w-7 h-7 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center font-bold text-[10px]">
              {s.tag}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{s.name}</div>
              <div className="text-text-dim text-[9px] truncate font-num">{s.subtitle}</div>
            </div>
            <div className="text-text-dim">›</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* =========================================================
 *  画面サンプル：記録とコメント
 * =======================================================*/
function ScreenComments() {
  return (
    <div className="flex flex-col gap-2 text-[10px]">
      <div className="font-bold text-[11px]">はじめくんの記録</div>
      <div className="p-2 rounded-lg bg-surface border border-border">
        <div className="flex items-center justify-between">
          <span className="font-semibold">棋譜並べ</span>
          <span className="font-num text-text-muted">45 分</span>
        </div>
        <div className="text-text-dim text-[9px] mt-0.5">5月19日 19:30</div>
      </div>
      <div className="text-text-dim text-[9px] mt-1">みたよ・コメント</div>
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-1.5">
          <div className="w-5 h-5 rounded-full bg-accent-soft text-accent flex items-center justify-center font-bold text-[9px] shrink-0">
            親
          </div>
          <div className="flex-1 p-1.5 rounded-lg bg-accent-soft text-[9px] leading-snug">
            よく続けてるね！えらい！
          </div>
        </div>
        <div className="flex gap-1.5">
          <div className="w-5 h-5 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center font-bold text-[9px] shrink-0">
            師
          </div>
          <div className="flex-1 p-1.5 rounded-lg bg-gold-soft text-[9px] leading-snug">
            ていねいに並べられたね。その調子！
          </div>
        </div>
      </div>
      <div className="mt-auto flex gap-1.5">
        <div className="flex-1 h-6 rounded-full bg-surface-overlay border border-border px-2 flex items-center text-text-dim text-[9px]">
          コメントを書く…
        </div>
        <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-[10px]">
          ↑
        </div>
      </div>
    </div>
  )
}

/* =========================================================
 *  画面サンプル：目標の進み具合
 * =======================================================*/
function ScreenGoals() {
  const goals = [
    { name: '今週・研究会', value: 75, target: '120分', color: 'var(--cat-study)' },
    { name: '今週・棋譜並べ', value: 55, target: '180分', color: 'var(--cat-kifu)' },
    { name: '今月・実戦', value: 90, target: '600分', color: 'var(--cat-game)' }
  ]
  return (
    <div className="flex flex-col gap-2 text-[10px]">
      <div className="font-bold text-[11px]">目標の進み具合</div>
      <div className="text-text-dim text-[9px]">あと少しでクリア！</div>
      <div className="flex flex-col gap-2 mt-1">
        {goals.map((g) => (
          <div key={g.name} className="p-2 rounded-lg bg-surface border border-border">
            <div className="flex items-center justify-between text-[9px]">
              <span className="font-semibold truncate">{g.name}</span>
              <span className="font-num text-text-muted">{g.target}</span>
            </div>
            <div className="h-1.5 rounded-full bg-border mt-1 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${g.value}%`, background: g.color }}
              />
            </div>
            <div className="flex justify-end mt-0.5">
              <span className="font-num font-bold text-[10px]" style={{ color: g.color }}>
                {g.value}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
