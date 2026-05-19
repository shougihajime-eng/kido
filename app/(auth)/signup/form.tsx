'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signupWithPinAction } from './actions'
import {
  LEVEL_KIND_LABEL,
  LEVEL_KIND_PLACEHOLDER,
  LEVEL_KIND_VALUES,
  type LevelKind
} from '@/lib/level'

type Role = 'student' | 'parent' | 'teacher'

const ROLES: { value: Role; label: string; desc: string }[] = [
  { value: 'student', label: '生徒', desc: '練習を記録して、自分の成長を見える化する' },
  { value: 'parent', label: '親', desc: 'お子さんの練習の様子を見守る' },
  { value: 'teacher', label: '先生・指導者', desc: '生徒の練習を確認してコメントする' }
]

export function SignupForm() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [pin, setPin] = useState('')
  const [role, setRole] = useState<Role>('student')
  const [levelKind, setLevelKind] = useState<LevelKind | ''>('')
  const [levelText, setLevelText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isStudent = role === 'student'
  const needsAnyText = levelKind !== '' && levelKind !== 'none'

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (isStudent) {
      if (!levelKind) {
        setError('段級のカテゴリを選んでください')
        return
      }
      if (needsAnyText && levelText.trim().length === 0) {
        setError('段級（例：三段、2級、B1 など）を入れてください')
        return
      }
    }

    startTransition(async () => {
      const result = await signupWithPinAction({
        displayName,
        role,
        pin,
        levelKind: isStudent && levelKind ? levelKind : null,
        levelText: isStudent && needsAnyText ? levelText.trim() : ''
      })

      if (!result.ok) {
        setError(result.error)
        return
      }

      router.push(result.role === 'student' ? '/dashboard' : '/family')
      router.refresh()
    })
  }

  const canSubmit =
    displayName.trim().length > 0 &&
    /^\d{4}$/.test(pin) &&
    !isPending &&
    (!isStudent ||
      (levelKind !== '' && (!needsAnyText || levelText.trim().length > 0)))

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 bg-surface border border-border rounded-2xl p-6"
    >
      {/* ロール選択 */}
      <div className="flex flex-col gap-2">
        <span className="text-sm text-text-muted">やくわりを選んでください</span>
        <div className="flex flex-col gap-2">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                role === r.value
                  ? 'border-accent bg-accent-soft shadow-[0_2px_12px_rgba(30,64,175,0.12)]'
                  : 'border-border bg-surface-elevated hover:border-border-strong'
              }`}
            >
              <div className="font-semibold text-text">{r.label}</div>
              <div className="text-xs text-text-muted mt-0.5">{r.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 名前 */}
      <label className="flex flex-col gap-2">
        <span className="text-sm text-text-muted">なまえ（自分や生徒を表す呼び名）</span>
        <input
          type="text"
          required
          maxLength={40}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="例：はじめ、おとうさん など"
          autoComplete="off"
          className="h-11 px-3 rounded-lg bg-surface-elevated border border-border text-text focus:border-accent focus:outline-none transition-colors"
        />
        <span className="text-[11px] text-text-dim">
          世界で1つだけ。同じ名前は使えない（重なったら違う呼び名にして）
        </span>
      </label>

      {/* 段級（生徒だけ・必須） */}
      {isStudent && (
        <div className="flex flex-col gap-2 bg-surface-elevated/50 border border-border rounded-xl p-4">
          <span className="text-sm font-semibold text-text">
            段級（だんきゅう）
            <span className="text-xs font-normal text-danger ml-2">必須</span>
          </span>
          <p className="text-[11px] text-text-dim leading-relaxed">
            ランキングで「どのクラスの人か」が分かるように使います。
          </p>
          <p className="text-[11px] text-accent leading-relaxed bg-accent-soft/40 border border-accent/20 rounded-lg px-3 py-2">
            奨励会員・女流棋士志望に限らず、<span className="font-bold">アマチュアの方も大歓迎</span>です。
            段位（三段・四段…）も級位（1級・3級…）も選べます。
          </p>

          <label className="flex flex-col gap-1.5 mt-1">
            <span className="text-xs text-text-muted">カテゴリを選ぶ</span>
            <select
              required
              value={levelKind}
              onChange={(e) => {
                const v = e.target.value as LevelKind | ''
                setLevelKind(v)
                if (v === 'none') setLevelText('')
              }}
              className="h-11 px-3 rounded-lg bg-surface border border-border text-text focus:border-accent focus:outline-none transition-colors"
            >
              <option value="" disabled>
                選んでください
              </option>
              {LEVEL_KIND_VALUES.map((k) => (
                <option key={k} value={k}>
                  {LEVEL_KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </label>

          {levelKind && levelKind !== 'none' && (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-text-muted">
                {levelKind === 'other' ? '段級（自由記入）' : '段級'}
              </span>
              <input
                type="text"
                required
                maxLength={20}
                value={levelText}
                onChange={(e) => setLevelText(e.target.value)}
                placeholder={LEVEL_KIND_PLACEHOLDER[levelKind as LevelKind] || '例：三段'}
                autoComplete="off"
                className="h-11 px-3 rounded-lg bg-surface border border-border text-text focus:border-accent focus:outline-none transition-colors"
              />
            </label>
          )}
        </div>
      )}

      {/* PIN */}
      <label className="flex flex-col gap-2">
        <span className="text-sm text-text-muted">あいことば（4桁の数字）</span>
        <input
          type="text"
          required
          inputMode="numeric"
          pattern="[0-9]{4}"
          maxLength={4}
          autoComplete="off"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="0000"
          className="h-14 px-3 rounded-lg bg-surface-elevated border border-border text-text font-num text-3xl tracking-[0.5em] text-center focus:border-accent focus:outline-none transition-colors"
        />
        <span className="text-[11px] text-text-dim">
          ログインのときに使うから、忘れない数字にしよう（誕生日とかは避けて）
        </span>
      </label>

      {error && (
        <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="h-14 rounded-full bg-accent text-white text-lg font-semibold shadow-[0_4px_20px_rgba(30,64,175,0.25)] hover:bg-accent-deep hover:shadow-[0_8px_28px_rgba(30,64,175,0.35)] transition-all disabled:opacity-50 disabled:shadow-none"
      >
        {isPending ? '登録中…' : 'アカウントを作る'}
      </button>
    </form>
  )
}
