import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
// Vercel Cron 用：毎朝7時(JST=22 UTC前日) に呼ばれる想定
// vercel.json で schedule を設定する

function todayJstISO(): string {
  const now = new Date()
  // JST = UTC+9
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const y = jst.getUTCFullYear()
  const m = String(jst.getUTCMonth() + 1).padStart(2, '0')
  const d = String(jst.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function ymdAddDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + days)
  const ny = date.getUTCFullYear()
  const nm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const nd = String(date.getUTCDate()).padStart(2, '0')
  return `${ny}-${nm}-${nd}`
}

export async function GET(req: Request) {
  // Vercel Cron からのリクエストは Authorization ヘッダーに CRON_SECRET が入る
  const authHeader = req.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET
  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:noreply@example.com'
  if (!publicKey || !privateKey) {
    return NextResponse.json({ ok: false, error: 'VAPID keys not set' }, { status: 500 })
  }
  webpush.setVapidDetails(subject, publicKey, privateKey)

  const supabase = createAdminClient()
  const today = todayJstISO()
  const tomorrow = ymdAddDays(today, 1)

  // 今日 or 明日 の予定を取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const untyped = supabase as any
  const { data: countdowns, error: cErr } = await untyped
    .from('countdowns')
    .select('id, user_id, title, target_date, emoji')
    .in('target_date', [today, tomorrow])

  if (cErr) {
    return NextResponse.json({ ok: false, error: cErr.message }, { status: 500 })
  }

  type Countdown = {
    id: string
    user_id: string
    title: string
    target_date: string
    emoji: string
  }
  const items = (countdowns ?? []) as Countdown[]

  if (items.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: '本日通知対象なし' })
  }

  // ユーザーごとに購読を取得
  const userIds = Array.from(new Set(items.map((c) => c.user_id)))
  const { data: subs, error: sErr } = await untyped
    .from('push_subscriptions')
    .select('user_id, endpoint, p256dh, auth')
    .in('user_id', userIds)

  if (sErr) {
    return NextResponse.json({ ok: false, error: sErr.message }, { status: 500 })
  }

  type Sub = { user_id: string; endpoint: string; p256dh: string; auth: string }
  const subsList = (subs ?? []) as Sub[]
  const subsByUser = new Map<string, Sub[]>()
  for (const s of subsList) {
    const list = subsByUser.get(s.user_id) ?? []
    list.push(s)
    subsByUser.set(s.user_id, list)
  }

  let sent = 0
  let failed = 0
  const expiredEndpoints: string[] = []

  for (const c of items) {
    const userSubs = subsByUser.get(c.user_id) ?? []
    if (userSubs.length === 0) continue

    const isToday = c.target_date === today
    const title = isToday ? `${c.emoji} 今日は ${c.title}！` : `${c.emoji} 明日は ${c.title}`
    const body = isToday
      ? 'がんばってきてね。準備はOK？'
      : 'いよいよ明日。今日できることをひとつ積み上げよう。'
    const payload = JSON.stringify({
      title,
      body,
      tag: `countdown-${c.id}`,
      url: '/countdowns'
    })

    for (const s of userSubs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth }
          },
          payload
        )
        sent += 1
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) {
          // 購読が無効化されたエンドポイントは削除候補に
          expiredEndpoints.push(s.endpoint)
        }
        failed += 1
      }
    }
  }

  // 期限切れの subscription を掃除
  if (expiredEndpoints.length > 0) {
    await untyped.from('push_subscriptions').delete().in('endpoint', expiredEndpoints)
  }

  return NextResponse.json({
    ok: true,
    sent,
    failed,
    expired: expiredEndpoints.length,
    countdowns: items.length
  })
}
