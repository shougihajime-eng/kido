import { createClient } from '@/lib/supabase/server'
import { startOfWeekISO, endOfWeekISO, todayLocalISO } from '@/lib/dates'
import { formatLevel } from '@/lib/level'
import { Leaderboard, type LeaderRow } from './Leaderboard'

export const metadata = {
  title: '仲間'
}

// 自動で最新化（誰かが記録するたびに反映）
export const revalidate = 30

export default async function FollowPage() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const today = todayLocalISO()
  const weekStart = startOfWeekISO(today)
  const weekEnd = endOfWeekISO(today)

  // 新規テーブル / RPC は Database 型未再生成のため untyped でアクセス
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const untyped = supabase as any

  // weekly_leaderboard RPC で全員の今週合計を取得
  const { data: rawLeaders } = await untyped.rpc('weekly_leaderboard', {
    start_date: weekStart,
    end_date: weekEnd
  })

  type LeaderboardRPCRow = {
    user_id: string
    display_name: string | null
    role: string
    level_kind: string | null
    level_text: string | null
    private_mode: boolean | null
    total_minutes: number | string
    shogi_minutes: number | string
    active_days: number | string
  }

  const leaders = (rawLeaders ?? []) as LeaderboardRPCRow[]

  // 自分のライバル一覧
  const { data: myRivals } = await untyped
    .from('rivals')
    .select('rival_id')
    .eq('user_id', user.id)

  const rivalIds = new Set<string>(
    ((myRivals ?? []) as { rival_id: string }[]).map((r) => r.rival_id)
  )

  // 自分のプロフィール（プライベートモード判定用）
  const { data: meProfile } = await untyped
    .from('profiles')
    .select('private_mode')
    .eq('id', user.id)
    .maybeSingle()
  const iAmPrivate = Boolean(meProfile?.private_mode)

  // 自分の表示名（ハイライト用）
  const me = leaders.find((l) => l.user_id === user.id)

  // 将棋時間で降順ソート（同点は active_days で）
  // 他人で private_mode=true の人は名前を「ひみつの仲間」に置換、段級も伏せる、★対象外
  const sortedLeaders: LeaderRow[] = leaders
    .map((l) => {
      const isMe = l.user_id === user.id
      const isPrivateOther = !isMe && Boolean(l.private_mode)
      return {
        userId: l.user_id,
        displayName: isPrivateOther
          ? 'ひみつの仲間'
          : (l.display_name ?? '名前なし'),
        levelLabel: isPrivateOther ? '' : formatLevel(l.level_kind, l.level_text),
        shogiMinutes: Number(l.shogi_minutes),
        totalMinutes: Number(l.total_minutes),
        activeDays: Number(l.active_days),
        isMe,
        isRival: rivalIds.has(l.user_id),
        isPrivate: isPrivateOther
      }
    })
    .sort((a, b) => {
      if (b.shogiMinutes !== a.shogiMinutes) return b.shogiMinutes - a.shogiMinutes
      return b.activeDays - a.activeDays
    })

  const myShogi = me ? Number(me.shogi_minutes) : 0
  const maxShogi = sortedLeaders.length > 0 ? sortedLeaders[0].shogiMinutes : 0
  const myRank = sortedLeaders.findIndex((l) => l.isMe) + 1
  const totalStudents = sortedLeaders.length

  return (
    <Leaderboard
      rows={sortedLeaders}
      myShogiMinutes={myShogi}
      maxShogiMinutes={maxShogi}
      myRank={myRank}
      totalStudents={totalStudents}
      weekStart={weekStart}
      weekEnd={weekEnd}
      iAmPrivate={iAmPrivate}
    />
  )
}
