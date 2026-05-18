/**
 * Supabase 自動生成型の置き場所。
 * いずれ `npx supabase gen types typescript --linked --schema kido > lib/supabase/types.ts` で上書きする。
 * それまでは最小限の手書き型でしのぐ。
 */

export type Database = {
  kido: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'student' | 'parent' | 'teacher'
          display_name: string
          avatar_url: string | null
          level_text: string | null
          ai_tone: 'gentle' | 'strict' | 'balanced' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: 'student' | 'parent' | 'teacher'
          display_name: string
          avatar_url?: string | null
          level_text?: string | null
          ai_tone?: 'gentle' | 'strict' | 'balanced' | null
        }
        Update: Partial<{
          role: 'student' | 'parent' | 'teacher'
          display_name: string
          avatar_url: string | null
          level_text: string | null
          ai_tone: 'gentle' | 'strict' | 'balanced' | null
        }>
      }
      relationships: {
        Row: {
          id: string
          adult_id: string
          student_id: string
          kind: 'parent' | 'teacher'
          confirmed: boolean
          created_at: string
        }
        Insert: {
          adult_id: string
          student_id: string
          kind: 'parent' | 'teacher'
          confirmed?: boolean
        }
        Update: Partial<{ confirmed: boolean }>
      }
      invite_codes: {
        Row: {
          code: string
          student_id: string
          kind: 'parent' | 'teacher'
          expires_at: string
          used_at: string | null
          used_by: string | null
          created_at: string
        }
        Insert: {
          code: string
          student_id: string
          kind: 'parent' | 'teacher'
          expires_at: string
        }
        Update: Partial<{ used_at: string | null; used_by: string | null }>
      }
      categories: {
        Row: {
          id: string
          owner_id: string | null
          name_ja: string
          icon_key: string
          color_token: string
          is_preset: boolean
          sort_order: number
        }
        Insert: {
          id?: string
          owner_id?: string | null
          name_ja: string
          icon_key: string
          color_token: string
          is_preset?: boolean
          sort_order?: number
        }
        Update: Partial<{
          name_ja: string
          icon_key: string
          color_token: string
          sort_order: number
        }>
      }
      training_records: {
        Row: {
          id: string
          user_id: string
          date: string
          category_id: string
          duration_minutes: number
          memo: string | null
          kifu_url: string | null
          recorded_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          date: string
          category_id: string
          duration_minutes: number
          memo?: string | null
          kifu_url?: string | null
          recorded_at?: string
        }
        Update: Partial<{
          date: string
          category_id: string
          duration_minutes: number
          memo: string | null
          kifu_url: string | null
        }>
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          category_id: string
          default_minutes: number
          label: string
          sort_order: number
          created_at: string
        }
        Insert: {
          user_id: string
          category_id: string
          default_minutes: number
          label: string
          sort_order?: number
        }
        Update: Partial<{
          category_id: string
          default_minutes: number
          label: string
          sort_order: number
        }>
      }
      goals: {
        Row: {
          id: string
          user_id: string
          period: 'weekly' | 'monthly'
          category_id: string | null
          target_minutes: number
          start_date: string
          end_date: string
          created_at: string
        }
        Insert: {
          user_id: string
          period: 'weekly' | 'monthly'
          category_id?: string | null
          target_minutes: number
          start_date: string
          end_date: string
        }
        Update: Partial<{
          target_minutes: number
          end_date: string
        }>
      }
      comments: {
        Row: {
          id: string
          record_id: string
          author_id: string | null // null = AI
          author_role: 'student' | 'parent' | 'teacher' | 'ai'
          content: string
          created_at: string
        }
        Insert: {
          record_id: string
          author_id?: string | null
          author_role: 'student' | 'parent' | 'teacher' | 'ai'
          content: string
        }
        Update: Partial<{ content: string }>
      }
      diary_entries: {
        Row: {
          id: string
          user_id: string
          date: string
          content: string
          visibility: 'self' | 'teacher' | 'parent' | 'ai'
          ai_reply: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          date: string
          content: string
          visibility: 'self' | 'teacher' | 'parent' | 'ai'
        }
        Update: Partial<{
          content: string
          visibility: 'self' | 'teacher' | 'parent' | 'ai'
          ai_reply: string | null
        }>
      }
      rating_history: {
        Row: {
          id: string
          user_id: string
          date: string
          platform: string
          rating_value: number
          created_at: string
        }
        Insert: {
          user_id: string
          date: string
          platform: string
          rating_value: number
        }
        Update: Partial<{ rating_value: number; platform: string }>
      }
      follows: {
        Row: {
          follower_id: string
          followed_id: string
          created_at: string
        }
        Insert: {
          follower_id: string
          followed_id: string
        }
        Update: Partial<Record<string, never>>
      }
      badges: {
        Row: {
          id: string
          name: string
          description: string
          icon_key: string
          criteria_json: Record<string, unknown>
        }
        Insert: {
          id: string
          name: string
          description: string
          icon_key: string
          criteria_json: Record<string, unknown>
        }
        Update: Partial<{
          name: string
          description: string
          icon_key: string
          criteria_json: Record<string, unknown>
        }>
      }
      user_badges: {
        Row: {
          user_id: string
          badge_id: string
          earned_at: string
        }
        Insert: {
          user_id: string
          badge_id: string
        }
        Update: Partial<Record<string, never>>
      }
      ai_comments: {
        Row: {
          id: string
          user_id: string
          generated_at: string
          content: string
          comment_type: 'daily' | 'weekly' | 'event'
          read_at: string | null
        }
        Insert: {
          user_id: string
          content: string
          comment_type: 'daily' | 'weekly' | 'event'
        }
        Update: Partial<{ read_at: string | null }>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Profile = Database['kido']['Tables']['profiles']['Row']
export type Category = Database['kido']['Tables']['categories']['Row']
export type TrainingRecord = Database['kido']['Tables']['training_records']['Row']
export type Goal = Database['kido']['Tables']['goals']['Row']
export type Comment = Database['kido']['Tables']['comments']['Row']
export type Relationship = Database['kido']['Tables']['relationships']['Row']
export type DiaryEntry = Database['kido']['Tables']['diary_entries']['Row']
export type RatingHistory = Database['kido']['Tables']['rating_history']['Row']
export type Badge = Database['kido']['Tables']['badges']['Row']
export type UserBadge = Database['kido']['Tables']['user_badges']['Row']
export type AIComment = Database['kido']['Tables']['ai_comments']['Row']

export type CategoryKey =
  | 'kifu_narabe'
  | 'tsume_shogi'
  | 'jissen'
  | 'kenkyukai'
  | 'vs'
  | 'ai_kenkyu'
  | 'joseki'
  | 'other'

export const PRESET_CATEGORIES: Array<{
  id: CategoryKey
  name_ja: string
  icon_key: string
  color_token: string
  sort_order: number
}> = [
  {
    id: 'kifu_narabe',
    name_ja: '棋譜並べ',
    icon_key: 'scroll',
    color_token: 'cat-kifu',
    sort_order: 1
  },
  {
    id: 'tsume_shogi',
    name_ja: '詰将棋',
    icon_key: 'tsume',
    color_token: 'cat-tsume',
    sort_order: 2
  },
  { id: 'jissen', name_ja: '実戦', icon_key: 'clock', color_token: 'cat-game', sort_order: 3 },
  {
    id: 'kenkyukai',
    name_ja: '研究会',
    icon_key: 'users',
    color_token: 'cat-study',
    sort_order: 4
  },
  { id: 'vs', name_ja: 'VS', icon_key: 'swords', color_token: 'cat-vs', sort_order: 5 },
  { id: 'ai_kenkyu', name_ja: 'AI研究', icon_key: 'cpu', color_token: 'cat-ai', sort_order: 6 },
  { id: 'joseki', name_ja: '定跡研究', icon_key: 'book', color_token: 'cat-book', sort_order: 7 },
  { id: 'other', name_ja: 'その他', icon_key: 'plus', color_token: 'cat-other', sort_order: 99 }
]
