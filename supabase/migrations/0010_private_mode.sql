-- ============================================================
-- 0010: プライベートモード（ランキングで名前を伏せる）
-- ============================================================
-- 設計:
--   * 生徒が ON にすると /follow ページで:
--     - 自分の画面では「順位」が消える（hero card の◯位/◯人中も）
--     - 他の生徒から見ると 名前が「ひみつの仲間」に置換される
--     - 時間は引き続き見える（ランキング順位の並びには入る）
--   * 親・先生も 見守り画面から ON/OFF を切り替えられる
--     → RLS で生徒本人しか profiles を UPDATE できないので、
--       SECURITY DEFINER 関数 set_student_private_mode を経由する
--   * デフォルトは FALSE（今のまま、ランキングに本名で出る）
-- ============================================================

------------------------------------------------------------
-- 1) profiles に private_mode 列を追加
------------------------------------------------------------
ALTER TABLE kido.profiles
  ADD COLUMN IF NOT EXISTS private_mode boolean NOT NULL DEFAULT FALSE;

------------------------------------------------------------
-- 2) weekly_leaderboard に private_mode を含める
--    クライアント側で「自分以外で private_mode=true の行は名前を伏せる」
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
  private_mode   boolean,
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
    p.private_mode,
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
  GROUP BY p.id, p.display_name, p.role, p.level_kind, p.level_text, p.private_mode;
$$;

GRANT EXECUTE ON FUNCTION kido.weekly_leaderboard(date, date)
  TO authenticated, anon;

------------------------------------------------------------
-- 3) 親・先生が紐づき生徒のプライベートモードを切り替えるための関数
--    紐づき(relationships) または スーパー先生 のみ実行可能
------------------------------------------------------------
CREATE OR REPLACE FUNCTION kido.set_student_private_mode(
  target_student_id uuid,
  new_value         boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = kido, public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_allowed boolean;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- 自分自身なら無条件で許可（生徒本人）
  IF v_caller = target_student_id THEN
    UPDATE kido.profiles
       SET private_mode = new_value
     WHERE id = target_student_id;
    RETURN;
  END IF;

  -- スーパー先生 or 紐づき親・先生のみ許可
  SELECT
    EXISTS (
      SELECT 1 FROM kido.profiles
      WHERE id = v_caller AND is_super_teacher = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM kido.relationships r
      WHERE r.adult_id = v_caller
        AND r.student_id = target_student_id
        AND r.confirmed = TRUE
    )
  INTO v_allowed;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'not authorized to change private_mode for this student';
  END IF;

  UPDATE kido.profiles
     SET private_mode = new_value
   WHERE id = target_student_id;
END;
$$;

GRANT EXECUTE ON FUNCTION kido.set_student_private_mode(uuid, boolean)
  TO authenticated;
