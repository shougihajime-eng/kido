'use client'

import { useState } from 'react'
import { Share2, Check, Copy } from 'lucide-react'

const SHARE_URL = 'https://kido-phi.vercel.app'
const SHARE_TEXT = '将棋の練習を毎日記録できる『棋道』、よかったら使ってみて！ 🌸'
const SHARE_TITLE = '棋道（きどう）'

interface Props {
  /** ボタンの大きさ感（'lg' は CTA 用の大きい見た目、'md' は普通） */
  size?: 'md' | 'lg'
  /** ボタンに出すラベル */
  label?: string
  /** 補足の小さい説明文（lg のときに下に出す） */
  hint?: string
}

export function ShareAppButton({
  size = 'md',
  label = 'お友達にすすめる',
  hint
}: Props) {
  const [state, setState] = useState<'idle' | 'shared' | 'copied' | 'error'>(
    'idle'
  )

  const handleClick = async () => {
    setState('idle')

    // 1) Web Share API（スマホは原則これでネイティブ共有メニュー）
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: SHARE_TITLE,
          text: SHARE_TEXT,
          url: SHARE_URL
        })
        setState('shared')
        return
      } catch (err) {
        // ユーザーがキャンセルしたら何もしない（AbortError）。
        // その他のエラーは clipboard フォールバックを試す
        if ((err as DOMException)?.name === 'AbortError') {
          return
        }
      }
    }

    // 2) clipboard フォールバック（PC や Web Share 非対応ブラウザ）
    try {
      const text = `${SHARE_TEXT}\n${SHARE_URL}`
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        // さらに古いブラウザ用
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setState('copied')
      // 数秒で元に戻す
      setTimeout(() => setState('idle'), 2400)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 2400)
    }
  }

  const big = size === 'lg'
  const baseClass = big
    ? 'h-14 px-7 text-base rounded-full'
    : 'h-11 px-5 text-sm rounded-full'

  const icon =
    state === 'copied' ? (
      <Check className="w-5 h-5" />
    ) : state === 'shared' ? (
      <Check className="w-5 h-5" />
    ) : (
      <Share2 className="w-5 h-5" />
    )

  const text =
    state === 'copied'
      ? 'リンクをコピーしました！'
      : state === 'shared'
        ? '共有しました！'
        : state === 'error'
          ? '共有できませんでした'
          : label

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        className={`${baseClass} inline-flex items-center gap-2 bg-accent text-white font-semibold shadow-[0_4px_20px_rgba(30,64,175,0.25)] hover:bg-accent-deep hover:shadow-[0_8px_28px_rgba(30,64,175,0.35)] transition-all`}
      >
        {icon}
        <span>{text}</span>
      </button>
      {big && hint && (
        <p className="text-xs text-text-dim text-center max-w-xs leading-relaxed">
          {hint}
        </p>
      )}
    </div>
  )
}

/**
 * 簡易版：説明文付きの小さなインライン版。
 * PC でも気持ちよく使えるよう、Copy アイコンも併設する。
 */
export function ShareAppRow() {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${SHARE_TEXT}\n${SHARE_URL}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 無視
    }
  }

  return (
    <div className="flex items-center gap-2 bg-surface border border-border rounded-full px-3 py-1.5">
      <span className="text-xs text-text-muted truncate font-num">{SHARE_URL}</span>
      <button
        type="button"
        onClick={copy}
        className="text-text-muted hover:text-accent transition-colors p-1"
        aria-label="URLをコピー"
      >
        {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  )
}
