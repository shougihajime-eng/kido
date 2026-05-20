'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type BookResult = { ok: true } | { ok: false; error: string }

export async function addBookAction(input: {
  title: string
  author?: string
  emoji: string
}): Promise<BookResult> {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'ログインしてください' }

  const title = (input.title ?? '').trim()
  if (title.length === 0) return { ok: false, error: 'タイトルを入れてください' }
  if (title.length > 80) return { ok: false, error: 'タイトルは80文字以内で入れてください' }

  const author = (input.author ?? '').trim()
  if (author.length > 60) return { ok: false, error: '著者名は60文字以内で入れてください' }

  const emoji = (input.emoji ?? '📘').trim() || '📘'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const untyped = supabase as any
  const { error } = await untyped.from('books').insert({
    user_id: user.id,
    title,
    author: author || null,
    emoji
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath('/books')
  revalidatePath('/record')
  return { ok: true }
}

export async function setBookStatusAction(
  id: string,
  status: 'reading' | 'done' | 'paused'
): Promise<BookResult> {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'ログインしてください' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const untyped = supabase as any
  const { error } = await untyped
    .from('books')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/books')
  return { ok: true }
}

export async function deleteBookAction(id: string): Promise<BookResult> {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'ログインしてください' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const untyped = supabase as any
  const { error } = await untyped
    .from('books')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/books')
  revalidatePath('/record')
  return { ok: true }
}
