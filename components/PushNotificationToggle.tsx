'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, AlertCircle } from 'lucide-react'

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToBuffer(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const buffer = new ArrayBuffer(raw.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < raw.length; i++) {
    view[i] = raw.charCodeAt(i)
  }
  return buffer
}

type State = 'loading' | 'unsupported' | 'denied' | 'idle' | 'subscribed' | 'working'

export function PushNotificationToggle() {
  const [state, setState] = useState<State>('loading')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      if (typeof window === 'undefined') return
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        if (!cancelled) setState('unsupported')
        return
      }
      if (!PUBLIC_KEY) {
        if (!cancelled) {
          setState('unsupported')
          setMessage('通知キーが未設定です（管理者にお問い合わせください）')
        }
        return
      }

      try {
        const reg = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready

        if (Notification.permission === 'denied') {
          if (!cancelled) setState('denied')
          return
        }

        const sub = await reg.pushManager.getSubscription()
        if (!cancelled) setState(sub ? 'subscribed' : 'idle')
      } catch (err) {
        if (!cancelled) {
          setState('unsupported')
          setMessage((err as Error).message)
        }
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [])

  const onEnable = async () => {
    setMessage(null)
    setState('working')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'idle')
        return
      }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToBuffer(PUBLIC_KEY)
      })

      const subJson = sub.toJSON() as {
        endpoint: string
        keys: { p256dh: string; auth: string }
      }

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
          userAgent: navigator.userAgent
        })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'サーバーへの登録に失敗しました')
      }
      setState('subscribed')
      setMessage('通知ONになりました！「明日が大会日です」みたいな通知が届きます。')
    } catch (err) {
      setState('idle')
      setMessage((err as Error).message)
    }
  }

  const onDisable = async () => {
    setMessage(null)
    setState('working')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint })
        })
        await sub.unsubscribe()
      }
      setState('idle')
      setMessage('通知OFFにしました')
    } catch (err) {
      setState('subscribed')
      setMessage((err as Error).message)
    }
  }

  if (state === 'loading') {
    return (
      <div className="bg-surface border border-border rounded-2xl p-5 text-text-muted text-sm">
        読み込み中…
      </div>
    )
  }

  if (state === 'unsupported') {
    return (
      <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-text-muted">
          <AlertCircle className="w-5 h-5" />
          <span className="font-semibold text-sm">この端末では通知が使えません</span>
        </div>
        <p className="text-xs text-text-dim leading-relaxed">
          iPhone の場合は「ホーム画面に追加」してから棋道を開くと使えるようになります。
          Android Chrome、PC Chrome / Edge では使えます。
        </p>
        {message && (
          <p className="text-[11px] text-text-dim">{message}</p>
        )}
      </div>
    )
  }

  if (state === 'denied') {
    return (
      <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-danger">
          <BellOff className="w-5 h-5" />
          <span className="font-semibold text-sm">通知が拒否されています</span>
        </div>
        <p className="text-xs text-text-dim leading-relaxed">
          一度「許可しない」を選んだ場合、ブラウザの設定から手動で許可する必要があります。
          ブラウザのアドレスバー左の鍵マーク → 「通知」→「許可」に変えてください。
        </p>
      </div>
    )
  }

  const isOn = state === 'subscribed'

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            backgroundColor: isOn ? 'var(--accent-soft)' : 'var(--surface-elevated)',
            color: isOn ? 'var(--accent)' : 'var(--text-muted)'
          }}
        >
          {isOn ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
        </div>
        <div className="flex-1">
          <div className="text-base font-semibold">プッシュ通知</div>
          <p className="text-xs text-text-dim mt-1 leading-relaxed">
            「明日が奨励会試験です！」のような通知をスマホ・PCに直接届けます。
            予定の前日・当日に、朝7時ごろにお知らせします。
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={isOn ? onDisable : onEnable}
        disabled={state === 'working'}
        className={`h-12 rounded-full font-semibold transition-colors disabled:opacity-60 ${
          isOn
            ? 'bg-surface-elevated border border-border text-text-muted hover:text-text'
            : 'bg-accent text-white hover:bg-accent-deep'
        }`}
      >
        {state === 'working'
          ? '処理中…'
          : isOn
            ? '通知をOFFにする'
            : '通知をONにする'}
      </button>

      {message && (
        <p
          className={`text-xs leading-relaxed ${
            isOn ? 'text-success' : 'text-text-dim'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  )
}
