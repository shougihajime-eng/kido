export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  kido: {
    Tables: {
      ai_comments: {
        Row: {
          comment_type: string
          content: string
          generated_at: string
          id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          comment_type: string
          content: string
          generated_at?: string
          id?: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          comment_type?: string
          content?: string
          generated_at?: string
          id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          criteria_json: Json
          description: string
          icon_key: string
          id: string
          name: string
        }
        Insert: {
          criteria_json: Json
          description: string
          icon_key: string
          id: string
          name: string
        }
        Update: {
          criteria_json?: Json
          description?: string
          icon_key?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color_token: string
          created_at: string
          icon_key: string
          id: string
          is_preset: boolean
          key: string | null
          name_ja: string
          owner_id: string | null
          sort_order: number
        }
        Insert: {
          color_token: string
          created_at?: string
          icon_key: string
          id?: string
          is_preset?: boolean
          key?: string | null
          name_ja: string
          owner_id?: string | null
          sort_order?: number
        }
        Update: {
          color_token?: string
          created_at?: string
          icon_key?: string
          id?: string
          is_preset?: boolean
          key?: string | null
          name_ja?: string
          owner_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string | null
          author_role: string
          content: string
          created_at: string
          id: string
          record_id: string
        }
        Insert: {
          author_id?: string | null
          author_role: string
          content: string
          created_at?: string
          id?: string
          record_id: string
        }
        Update: {
          author_id?: string | null
          author_role?: string
          content?: string
          created_at?: string
          id?: string
          record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "training_records"
            referencedColumns: ["id"]
          },
        ]
      }
      diary_entries: {
        Row: {
          ai_reply: string | null
          content: string
          created_at: string
          date: string
          id: string
          user_id: string
          visibility: string
        }
        Insert: {
          ai_reply?: string | null
          content: string
          created_at?: string
          date: string
          id?: string
          user_id: string
          visibility: string
        }
        Update: {
          ai_reply?: string | null
          content?: string
          created_at?: string
          date?: string
          id?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "diary_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          category_id: string
          created_at: string
          default_minutes: number
          id: string
          label: string
          sort_order: number
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          default_minutes: number
          id?: string
          label: string
          sort_order?: number
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          default_minutes?: number
          id?: string
          label?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          followed_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          followed_id: string
          follower_id: string
        }
        Update: {
          created_at?: string
          followed_id?: string
          follower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_followed_id_fkey"
            columns: ["followed_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          category_id: string | null
          created_at: string
          end_date: string
          id: string
          period: string
          start_date: string
          target_minutes: number
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          end_date: string
          id?: string
          period: string
          start_date: string
          target_minutes: number
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          end_date?: string
          id?: string
          period?: string
          start_date?: string
          target_minutes?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          kind: string
          student_id: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          kind: string
          student_id: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          kind?: string
          student_id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invite_codes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invite_codes_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_tone: string | null
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          level_text: string | null
          role: string
          updated_at: string
        }
        Insert: {
          ai_tone?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id: string
          level_text?: string | null
          role: string
          updated_at?: string
        }
        Update: {
          ai_tone?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          level_text?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      rating_history: {
        Row: {
          created_at: string
          date: string
          id: string
          platform: string
          rating_value: number
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          platform: string
          rating_value: number
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          platform?: string
          rating_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rating_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      relationships: {
        Row: {
          adult_id: string
          confirmed: boolean
          created_at: string
          id: string
          kind: string
          student_id: string
        }
        Insert: {
          adult_id: string
          confirmed?: boolean
          created_at?: string
          id?: string
          kind: string
          student_id: string
        }
        Update: {
          adult_id?: string
          confirmed?: boolean
          created_at?: string
          id?: string
          kind?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationships_adult_id_fkey"
            columns: ["adult_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_records: {
        Row: {
          category_id: string
          created_at: string
          date: string
          duration_minutes: number
          id: string
          kifu_url: string | null
          memo: string | null
          recorded_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          date: string
          duration_minutes: number
          id?: string
          kifu_url?: string | null
          memo?: string | null
          recorded_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          date?: string
          duration_minutes?: number
          id?: string
          kifu_url?: string | null
          memo?: string | null
          recorded_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_records_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: { Args: { target_role: string }; Returns: boolean }
      is_linked_adult: { Args: { target_student: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  kido: {
    Enums: {},
  },
} as const

