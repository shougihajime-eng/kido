-- ============================================================
-- 0008: 段級カテゴリ + 段級テキスト + スーパー先生（はじめ）
-- ============================================================
-- 設計:
--   * 段級は 2 列に分けて格納
--     - level_kind: 奨励会員 / 女流棋士 / 研修会員 / アマチュア / その他 / まだ無し
--     - level_text: 「三段」「2級」「B1」など、段級の文字部分（自由記入）
--   * 表示は「奨励会 三段」のようにアプリ側で合成
--
--   * is_super_teacher: TRUE のユーザー（はじめ）は招待関係なしで
--     全生徒の練習記録・気分・対局結果・目標・コメント等を読める
--   * 他の親・先生は従来どおり relationships 経由（招待制）
-- ============================================================

------------------------------------------------------------
-- 1) profiles に level_kind 列と is_super_teacher 列を追加
------------------------------------------------------------
ALTER TABLE kido.profiles
  ADD COLUMN IF NOT EXISTS level_kind text
    CHECK (level_kind IN ('shoreikai', 'joryu', 'kenshukai', 'amateur', 'other', 'none'));

ALTER TABLE kido.profiles
  ADD COLUMN IF NOT EXISTS is_super_teacher boolean NOT NULL DEFAULT FALSE;

------------------------------------------------------------
-- 2) スーパー先生判定ヘルパー
------------------------------------------------------------
CREATE OR REPLACE FUNCTION kido.is_super_teacher()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = kido, public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM kido.profiles
    WHERE id = auth.uid() AND is_super_teacher = TRUE
  );
END;
$$;

GRANT EXECUTE ON FUNCTION kido.is_super_teacher() TO authenticated, anon;

------------------------------------------------------------
-- 3) handle_new_user: signup 時に level_kind / level_text を取り込む
------------------------------------------------------------
CREATE OR REPLACE FUNCTION kido.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = kido, public
AS $$
DECLARE
  v_role text;
  v_display_name text;
  v_synthetic_email text;
  v_level_kind text;
  v_level_text text;
  v_kido_signup boolean;
BEGIN
  v_kido_signup := COALESCE(NEW.raw_user_meta_data->>'app', '') = 'kido';

  IF NOT v_kido_signup THEN
    RETURN NEW;
  END IF;

  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );
  v_synthetic_email := NEW.raw_user_meta_data->>'synthetic_email';
  v_level_kind := NEW.raw_user_meta_data->>'level_kind';
  v_level_text := NEW.raw_user_meta_data->>'level_text';

  IF v_role NOT IN ('student', 'parent', 'teacher') THEN
    v_role := 'student';
  END IF;

  IF v_level_kind IS NOT NULL
     AND v_level_kind NOT IN ('shoreikai', 'joryu', 'kenshukai', 'amateur', 'other', 'none') THEN
    v_level_kind := NULL;
  END IF;

  INSERT INTO kido.profiles (id, role, display_name, synthetic_email, level_kind, level_text)
  VALUES (NEW.id, v_role, v_display_name, v_synthetic_email, v_level_kind, NULLIF(v_level_text, ''))
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

------------------------------------------------------------
-- 4) RLS をスーパー先生対応に拡張
--    既存の self / linked_adult / follows 条件は残し、
--    OR kido.is_super_teacher() を足す
------------------------------------------------------------

-- training_records
DROP POLICY IF EXISTS "training_select_self_or_linked" ON kido.training_records;
CREATE POLICY "training_select_self_or_linked"
  ON kido.training_records FOR SELECT
  USING (
    user_id = auth.uid()
    OR kido.is_linked_adult(user_id)
    OR kido.is_super_teacher()
    OR EXISTS (
      SELECT 1 FROM kido.follows f
      WHERE f.follower_id = auth.uid() AND f.followed_id = training_records.user_id
    )
  );

-- goals
DROP POLICY IF EXISTS "goals_select_self_or_linked" ON kido.goals;
CREATE POLICY "goals_select_self_or_linked"
  ON kido.goals FOR SELECT
  USING (
    user_id = auth.uid()
    OR kido.is_linked_adult(user_id)
    OR kido.is_super_teacher()
  );

-- comments
DROP POLICY IF EXISTS "comments_select_related" ON kido.comments;
CREATE POLICY "comments_select_related"
  ON kido.comments FOR SELECT
  USING (
    author_id = auth.uid()
    OR kido.is_super_teacher()
    OR EXISTS (
      SELECT 1 FROM kido.training_records r
      WHERE r.id = record_id
      AND (r.user_id = auth.uid() OR kido.is_linked_adult(r.user_id))
    )
  );

-- スーパー先生もコメントを書ける（teacher 名義で）
DROP POLICY IF EXISTS "comments_insert_linked_adult" ON kido.comments;
CREATE POLICY "comments_insert_linked_adult"
  ON kido.comments FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND author_role IN ('parent', 'teacher')
    AND (
      kido.is_super_teacher()
      OR EXISTS (
        SELECT 1 FROM kido.training_records r
        WHERE r.id = record_id
        AND kido.is_linked_adult(r.user_id)
      )
    )
  );

-- diary_entries (visibility='teacher' のみスーパー先生にも開ける。'self' は本人専用のまま)
DROP POLICY IF EXISTS "diary_select_per_visibility" ON kido.diary_entries;
CREATE POLICY "diary_select_per_visibility"
  ON kido.diary_entries FOR SELECT
  USING (
    user_id = auth.uid()
    OR (visibility = 'teacher' AND kido.is_super_teacher())
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

-- rating_history
DROP POLICY IF EXISTS "rating_select_self_or_linked" ON kido.rating_history;
CREATE POLICY "rating_select_self_or_linked"
  ON kido.rating_history FOR SELECT
  USING (
    user_id = auth.uid()
    OR kido.is_linked_adult(user_id)
    OR kido.is_super_teacher()
  );

-- user_badges
DROP POLICY IF EXISTS "user_badges_select_self_or_linked" ON kido.user_badges;
CREATE POLICY "user_badges_select_self_or_linked"
  ON kido.user_badges FOR SELECT
  USING (
    user_id = auth.uid()
    OR kido.is_linked_adult(user_id)
    OR kido.is_super_teacher()
  );

-- ai_comments
DROP POLICY IF EXISTS "ai_comments_select_self_or_linked" ON kido.ai_comments;
CREATE POLICY "ai_comments_select_self_or_linked"
  ON kido.ai_comments FOR SELECT
  USING (
    user_id = auth.uid()
    OR kido.is_linked_adult(user_id)
    OR kido.is_super_teacher()
  );

-- mood_logs
DROP POLICY IF EXISTS "mood_select_self_or_linked" ON kido.mood_logs;
CREATE POLICY "mood_select_self_or_linked"
  ON kido.mood_logs FOR SELECT
  USING (
    user_id = auth.uid()
    OR kido.is_linked_adult(user_id)
    OR kido.is_super_teacher()
  );

-- game_results
DROP POLICY IF EXISTS "games_select_self_or_linked" ON kido.game_results;
CREATE POLICY "games_select_self_or_linked"
  ON kido.game_results FOR SELECT
  USING (
    user_id = auth.uid()
    OR kido.is_linked_adult(user_id)
    OR kido.is_super_teacher()
  );

------------------------------------------------------------
-- 5) weekly_leaderboard に level_kind と level_text を含める
------------------------------------------------------------
DROP FUNCTION IF EXISTS kido.weekly_leaderboard(date, date);

CREATE OR REPLACE FUNCTION kido.weekly_leaderboard(
  start_date date,
  end_date date
)
RETURNS TABLE (
  user_id        uuid,
  display_name   text,
  role           text,
  level_kind     text,
  level_text     text,
  total_minutes  bigint,
  shogi_minutes  bigint,
  active_days    bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = kido, public
AS $$
  SELECT
    p.id AS user_id,
    p.display_name,
    p.role,
    p.level_kind,
    p.level_text,
    COALESCE(SUM(tr.duration_minutes), 0)::bigint AS total_minutes,
    COALESCE(
      SUM(CASE WHEN c.kind = 'shogi' THEN tr.duration_minutes ELSE 0 END),
      0
    )::bigint AS shogi_minutes,
    COUNT(DISTINCT CASE WHEN c.kind = 'shogi' THEN tr.date END)::bigint AS active_days
  FROM kido.profiles p
  LEFT JOIN kido.training_records tr
    ON tr.user_id = p.id
   AND tr.date >= start_date
   AND tr.date <= end_date
  LEFT JOIN kido.categories c ON c.id = tr.category_id
  WHERE p.role = 'student'
  GROUP BY p.id, p.display_name, p.role, p.level_kind, p.level_text;
$$;

GRANT EXECUTE ON FUNCTION kido.weekly_leaderboard(date, date)
  TO authenticated, anon;

------------------------------------------------------------
-- 6) はじめさんをスーパー先生にする
--    display_name = 'はじめ' を採用（4桁PIN サインアップで設定する名前）
--    既にプロフィールが無くても害は無い（0 行 UPDATE）。
--    新規作成後に手動で呼びたい場合は同じ UPDATE をもう1度流せばよい。
------------------------------------------------------------
UPDATE kido.profiles
   SET is_super_teacher = TRUE,
       role             = 'teacher'
 WHERE display_name = 'はじめ';
