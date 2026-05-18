-- 棋道 (kido) 初期スキーマ
-- 共有 Supabase プロジェクト内に kido スキーマを切り、テーブル・RLS を構築する
-- 他プロジェクト（shogi_hajime_ai, shogi_jikanwari, hajime_shogi）には触れない

------------------------------------------------------------
-- 0) スキーマ + 共通権限
------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS kido;
GRANT USAGE ON SCHEMA kido TO anon, authenticated, service_role;

------------------------------------------------------------
-- 1) 共通 updated_at トリガー関数（テーブル参照しないのでここで OK）
------------------------------------------------------------
CREATE OR REPLACE FUNCTION kido.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

------------------------------------------------------------
-- 2) 全テーブル定義（先に作る → あとでヘルパー関数 & RLS）
------------------------------------------------------------

-- profiles
CREATE TABLE kido.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          text NOT NULL CHECK (role IN ('student', 'parent', 'teacher')),
  display_name  text NOT NULL,
  avatar_url    text,
  level_text    text,
  ai_tone       text CHECK (ai_tone IN ('gentle', 'strict', 'balanced')) DEFAULT 'balanced',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON kido.profiles
  FOR EACH ROW EXECUTE FUNCTION kido.set_updated_at();

-- relationships
CREATE TABLE kido.relationships (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adult_id    uuid NOT NULL REFERENCES kido.profiles(id) ON DELETE CASCADE,
  student_id  uuid NOT NULL REFERENCES kido.profiles(id) ON DELETE CASCADE,
  kind        text NOT NULL CHECK (kind IN ('parent', 'teacher')),
  confirmed   boolean NOT NULL DEFAULT TRUE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (adult_id, student_id),
  CHECK (adult_id <> student_id)
);
CREATE INDEX idx_relationships_adult ON kido.relationships(adult_id);
CREATE INDEX idx_relationships_student ON kido.relationships(student_id);

-- invite_codes
CREATE TABLE kido.invite_codes (
  code        text PRIMARY KEY,
  student_id  uuid NOT NULL REFERENCES kido.profiles(id) ON DELETE CASCADE,
  kind        text NOT NULL CHECK (kind IN ('parent', 'teacher')),
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  used_by     uuid REFERENCES kido.profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_invite_codes_student ON kido.invite_codes(student_id);

-- categories
CREATE TABLE kido.categories (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key          text UNIQUE,
  owner_id     uuid REFERENCES kido.profiles(id) ON DELETE CASCADE,
  name_ja      text NOT NULL,
  icon_key     text NOT NULL,
  color_token  text NOT NULL,
  is_preset    boolean NOT NULL DEFAULT FALSE,
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_categories_owner ON kido.categories(owner_id) WHERE owner_id IS NOT NULL;

-- training_records
CREATE TABLE kido.training_records (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES kido.profiles(id) ON DELETE CASCADE,
  date              date NOT NULL,
  category_id       uuid NOT NULL REFERENCES kido.categories(id),
  duration_minutes  integer NOT NULL CHECK (duration_minutes > 0 AND duration_minutes <= 1440),
  memo              text,
  kifu_url          text,
  recorded_at       timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_training_records_user_date ON kido.training_records(user_id, date DESC);
CREATE INDEX idx_training_records_category ON kido.training_records(category_id);

CREATE TRIGGER trg_training_records_updated_at
  BEFORE UPDATE ON kido.training_records
  FOR EACH ROW EXECUTE FUNCTION kido.set_updated_at();

-- favorites
CREATE TABLE kido.favorites (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES kido.profiles(id) ON DELETE CASCADE,
  category_id       uuid NOT NULL REFERENCES kido.categories(id),
  default_minutes   integer NOT NULL CHECK (default_minutes > 0 AND default_minutes <= 1440),
  label             text NOT NULL,
  sort_order        integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_favorites_user ON kido.favorites(user_id, sort_order);

-- goals
CREATE TABLE kido.goals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES kido.profiles(id) ON DELETE CASCADE,
  period          text NOT NULL CHECK (period IN ('weekly', 'monthly')),
  category_id     uuid REFERENCES kido.categories(id),
  target_minutes  integer NOT NULL CHECK (target_minutes > 0),
  start_date      date NOT NULL,
  end_date        date NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);
CREATE INDEX idx_goals_user ON kido.goals(user_id, end_date DESC);

-- comments
CREATE TABLE kido.comments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id    uuid NOT NULL REFERENCES kido.training_records(id) ON DELETE CASCADE,
  author_id    uuid REFERENCES kido.profiles(id) ON DELETE SET NULL,
  author_role  text NOT NULL CHECK (author_role IN ('student', 'parent', 'teacher', 'ai')),
  content      text NOT NULL CHECK (length(content) > 0 AND length(content) <= 2000),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_record ON kido.comments(record_id, created_at);

-- diary_entries
CREATE TABLE kido.diary_entries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES kido.profiles(id) ON DELETE CASCADE,
  date        date NOT NULL,
  content     text NOT NULL,
  visibility  text NOT NULL CHECK (visibility IN ('self', 'teacher', 'parent', 'ai')),
  ai_reply    text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_diary_user_date ON kido.diary_entries(user_id, date DESC);

-- rating_history
CREATE TABLE kido.rating_history (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES kido.profiles(id) ON DELETE CASCADE,
  date         date NOT NULL,
  platform     text NOT NULL,
  rating_value integer NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_rating_user_date ON kido.rating_history(user_id, date DESC);

-- follows
CREATE TABLE kido.follows (
  follower_id  uuid NOT NULL REFERENCES kido.profiles(id) ON DELETE CASCADE,
  followed_id  uuid NOT NULL REFERENCES kido.profiles(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followed_id),
  CHECK (follower_id <> followed_id)
);

-- badges (master)
CREATE TABLE kido.badges (
  id             text PRIMARY KEY,
  name           text NOT NULL,
  description    text NOT NULL,
  icon_key       text NOT NULL,
  criteria_json  jsonb NOT NULL
);

-- user_badges (earned)
CREATE TABLE kido.user_badges (
  user_id     uuid NOT NULL REFERENCES kido.profiles(id) ON DELETE CASCADE,
  badge_id    text NOT NULL REFERENCES kido.badges(id),
  earned_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

-- ai_comments
CREATE TABLE kido.ai_comments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES kido.profiles(id) ON DELETE CASCADE,
  generated_at  timestamptz NOT NULL DEFAULT now(),
  content       text NOT NULL,
  comment_type  text NOT NULL CHECK (comment_type IN ('daily', 'weekly', 'event')),
  read_at       timestamptz
);
CREATE INDEX idx_ai_comments_user_time ON kido.ai_comments(user_id, generated_at DESC);

------------------------------------------------------------
-- 3) ヘルパー関数（テーブル参照あり → plpgsql で遅延評価）
------------------------------------------------------------

CREATE OR REPLACE FUNCTION kido.is_linked_adult(target_student uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = kido, public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM kido.relationships
    WHERE adult_id = auth.uid()
      AND student_id = target_student
      AND confirmed = TRUE
  );
END;
$$;

CREATE OR REPLACE FUNCTION kido.has_role(target_role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = kido, public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM kido.profiles
    WHERE id = auth.uid() AND role = target_role
  );
END;
$$;

------------------------------------------------------------
-- 4) RLS 有効化
------------------------------------------------------------
ALTER TABLE kido.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE kido.relationships    ENABLE ROW LEVEL SECURITY;
ALTER TABLE kido.invite_codes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE kido.categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE kido.training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE kido.favorites        ENABLE ROW LEVEL SECURITY;
ALTER TABLE kido.goals            ENABLE ROW LEVEL SECURITY;
ALTER TABLE kido.comments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE kido.diary_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE kido.rating_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE kido.follows          ENABLE ROW LEVEL SECURITY;
ALTER TABLE kido.badges           ENABLE ROW LEVEL SECURITY;
ALTER TABLE kido.user_badges      ENABLE ROW LEVEL SECURITY;
ALTER TABLE kido.ai_comments      ENABLE ROW LEVEL SECURITY;

------------------------------------------------------------
-- 5) RLS ポリシー
------------------------------------------------------------

-- profiles
CREATE POLICY "profiles_select_self_or_linked"
  ON kido.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR kido.is_linked_adult(id)
    OR EXISTS (
      SELECT 1 FROM kido.relationships r
      WHERE r.student_id = auth.uid() AND r.adult_id = profiles.id
    )
    OR EXISTS (
      SELECT 1 FROM kido.follows f
      WHERE (f.follower_id = auth.uid() AND f.followed_id = profiles.id)
         OR (f.followed_id = auth.uid() AND f.follower_id = profiles.id)
    )
  );

CREATE POLICY "profiles_insert_self"
  ON kido.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_self"
  ON kido.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- relationships
CREATE POLICY "relationships_select_party"
  ON kido.relationships FOR SELECT
  USING (adult_id = auth.uid() OR student_id = auth.uid());

CREATE POLICY "relationships_delete_party"
  ON kido.relationships FOR DELETE
  USING (adult_id = auth.uid() OR student_id = auth.uid());

-- invite_codes
CREATE POLICY "invite_codes_select_own_student"
  ON kido.invite_codes FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "invite_codes_insert_self_student"
  ON kido.invite_codes FOR INSERT
  WITH CHECK (
    student_id = auth.uid() AND kido.has_role('student')
  );

CREATE POLICY "invite_codes_delete_own"
  ON kido.invite_codes FOR DELETE
  USING (student_id = auth.uid());

-- categories
CREATE POLICY "categories_select_preset_or_own"
  ON kido.categories FOR SELECT
  USING (is_preset = TRUE OR owner_id = auth.uid());

CREATE POLICY "categories_insert_custom_self"
  ON kido.categories FOR INSERT
  WITH CHECK (owner_id = auth.uid() AND is_preset = FALSE);

CREATE POLICY "categories_update_custom_self"
  ON kido.categories FOR UPDATE
  USING (owner_id = auth.uid() AND is_preset = FALSE);

CREATE POLICY "categories_delete_custom_self"
  ON kido.categories FOR DELETE
  USING (owner_id = auth.uid() AND is_preset = FALSE);

-- training_records
CREATE POLICY "training_select_self_or_linked"
  ON kido.training_records FOR SELECT
  USING (
    user_id = auth.uid()
    OR kido.is_linked_adult(user_id)
    OR EXISTS (
      SELECT 1 FROM kido.follows f
      WHERE f.follower_id = auth.uid() AND f.followed_id = training_records.user_id
    )
  );

CREATE POLICY "training_insert_self" ON kido.training_records
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "training_update_self" ON kido.training_records
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "training_delete_self" ON kido.training_records
  FOR DELETE USING (user_id = auth.uid());

-- favorites
CREATE POLICY "favorites_all_self" ON kido.favorites
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- goals
CREATE POLICY "goals_select_self_or_linked" ON kido.goals
  FOR SELECT USING (user_id = auth.uid() OR kido.is_linked_adult(user_id));

CREATE POLICY "goals_modify_self" ON kido.goals
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- comments
CREATE POLICY "comments_select_related" ON kido.comments
  FOR SELECT USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM kido.training_records r
      WHERE r.id = record_id
      AND (r.user_id = auth.uid() OR kido.is_linked_adult(r.user_id))
    )
  );

CREATE POLICY "comments_insert_linked_adult" ON kido.comments
  FOR INSERT WITH CHECK (
    author_id = auth.uid()
    AND author_role IN ('parent', 'teacher')
    AND EXISTS (
      SELECT 1 FROM kido.training_records r
      WHERE r.id = record_id
      AND kido.is_linked_adult(r.user_id)
    )
  );

CREATE POLICY "comments_delete_own" ON kido.comments
  FOR DELETE USING (author_id = auth.uid());

-- diary_entries
CREATE POLICY "diary_select_per_visibility" ON kido.diary_entries
  FOR SELECT USING (
    user_id = auth.uid()
    OR (visibility = 'teacher' AND EXISTS (
      SELECT 1 FROM kido.relationships r
      WHERE r.adult_id = auth.uid() AND r.student_id = diary_entries.user_id
        AND r.kind = 'teacher' AND r.confirmed = TRUE
    ))
    OR (visibility = 'parent' AND EXISTS (
      SELECT 1 FROM kido.relationships r
      WHERE r.adult_id = auth.uid() AND r.student_id = diary_entries.user_id
        AND r.kind = 'parent' AND r.confirmed = TRUE
    ))
  );

CREATE POLICY "diary_modify_self" ON kido.diary_entries
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- rating_history
CREATE POLICY "rating_select_self_or_linked" ON kido.rating_history
  FOR SELECT USING (user_id = auth.uid() OR kido.is_linked_adult(user_id));

CREATE POLICY "rating_modify_self" ON kido.rating_history
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- follows
CREATE POLICY "follows_select_party" ON kido.follows
  FOR SELECT USING (follower_id = auth.uid() OR followed_id = auth.uid());

CREATE POLICY "follows_insert_self" ON kido.follows
  FOR INSERT WITH CHECK (follower_id = auth.uid());

CREATE POLICY "follows_delete_self" ON kido.follows
  FOR DELETE USING (follower_id = auth.uid());

-- badges (master): 全員閲覧、変更は service_role のみ
CREATE POLICY "badges_select_all" ON kido.badges FOR SELECT USING (TRUE);

-- user_badges
CREATE POLICY "user_badges_select_self_or_linked" ON kido.user_badges
  FOR SELECT USING (user_id = auth.uid() OR kido.is_linked_adult(user_id));

-- ai_comments
CREATE POLICY "ai_comments_select_self_or_linked" ON kido.ai_comments
  FOR SELECT USING (user_id = auth.uid() OR kido.is_linked_adult(user_id));

CREATE POLICY "ai_comments_update_read_self" ON kido.ai_comments
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

------------------------------------------------------------
-- 6) 権限まとめ
------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA kido TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA kido TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA kido TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA kido TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA kido TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA kido GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA kido GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA kido GRANT ALL ON TABLES TO service_role;
