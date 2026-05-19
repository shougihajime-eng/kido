'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfileAction } from './actions'
import {
  LEVEL_KIND_LABEL,
  LEVEL_KIND_PLACEHOLDER,
  LEVEL_KIND_VALUES,
  type LevelKind
} from '@/lib/level'

interface Props {
  initialName: string
  initialLevelKind: LevelKind | ''
  initialLevelText: string
  initialPrivateMode: boolean
  role: 'student' | 'parent' | 'teacher'
}

export function ProfileEditForm({
  initialName,
  initialLevelKind,
  initialLevelText,
  initialPrivateMode,
  role
}: Props) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState(initialName)
  const [levelKind, setLevelKind] = useState<LevelKind | ''>(initialLevelKind)
  const [levelText, setLevelText] = useState(initialLevelText)
  const [privateMode, setPrivateMode] = useState(initialPrivateMode)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isStudent = role === 'student'
  const needsAnyText = levelKind !== '' && levelKind !== 'none'

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaved(false)

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
      const result = await updateProfileAction({
        displayName,
        levelKind: isStudent && levelKind ? levelKind : null,
        levelText: isStudent && needsAnyText ? levelText.trim() : '',
        privateMode: isStudent ? privateMode : false
      })

      if (!result.ok) {
        setError(result.error)
        return
      }
      setSaved(true)
      router.refresh()
    })
  }

  const canSubmit =
    displayName.trim().length > 0 &&
    !isPending &&
    (!isStudent ||
      (levelKind !== '' && (!needsAnyText || levelText.trim().length > 0)))

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 bg-surface border border-border rounded-2xl p-6">
      {/* 名前 */}
      <label className="flex flex-col gap-2">
        <span className="text-sm text-text-muted">なまえ</span>
        <input
          type="text"
          required
          maxLength={40}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          autoComplete="off"
          className="h-11 px-3 rounded-lg bg-surface-elevated border border-border text-text focus:border-accent focus:outline-none transition-colors"
        />
        <span className="text-[11px] text-text-dim">
          世界で1つだけ。重なるユーザーがいると保存できません
        </span>
      </label>

      {/* 段級（生徒だけ） */}
      {isStudent && (
        <div className="flex flex-col gap-2 bg-surface-elevated/50 border border-border rounded-xl p-4">
          <span className="text-sm font-semibold text-text">段級</span>
          <p className="text-[11px] text-text-dim leading-relaxed">
            ランキングで「どのクラスの人か」が分かるように表示されます。
          </p>

          <label className="flex flex-col gap-1.5 mt-1">
            <span className="text-xs text-text-muted">カテゴリ</span>
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

      {/* プライベートモード（生徒だけ） */}
      {isStudent && (
        <div className="flex flex-col gap-2 bg-surface-elevated/50 border border-border rounded-xl p-4">
          <span className="text-sm font-semibold text-text">プライベートモード</span>
          <p className="text-[11px] text-text-dim leading-relaxed">
            ONにすると、仲間のランキングであなたの名前が「ひみつの仲間」と表示されます。
            あなたの画面では順位の数字が消えて、自分のペースで取り組めます。
            時間（がんばった分）は仲間にも見えます。
          </p>
          <label className="flex items-center gap-3 mt-1 cursor-pointer">
            <button
              type="button"
              onClick={() => setPrivateMode((v) => !v)}
              aria-pressed={privateMode}
              className={`relative w-14 h-8 rounded-full transition-colors shrink-0 ${
                privateMode ? 'bg-accent' : 'bg-surface-overlay border border-border'
              }`}
            >
              <span
                className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${
                  privateMode ? 'left-7' : 'left-1'
                }`}
              />
            </button>
            <span className="text-sm font-semibold">
              {privateMode ? 'ON（プライベート）' : 'OFF（みんなに名前が見える）'}
            </span>
          </label>
        </div>
      )}

      {error && (
        <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {saved && !error && (
        <p className="text-sm text-success bg-success/10 border border-success/30 rounded-lg px-3 py-2">
          保存しました
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="h-12 rounded-full bg-accent text-white text-base font-semibold shadow-[0_4px_20px_rgba(30,64,175,0.25)] hover:bg-accent-deep hover:shadow-[0_8px_28px_rgba(30,64,175,0.35)] transition-all disabled:opacity-50 disabled:shadow-none"
      >
        {isPending ? '保存中…' : '保存する'}
      </button>
    </form>
  )
}
