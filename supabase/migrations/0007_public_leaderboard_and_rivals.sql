-- ============================================================
-- 0006: 招待なしで誰でも見える「みんなランキング」と
--       自分用ライバルマーク（rivals）を追加
-- ============================================================
-- 設計方針:
--   * profiles は「全員閲覧可」に開く（display_name / role / level_text などの公開項目）
--   * 練習記録の "個別" は引き続きフォロー or 紐づけがないと見えない（プライバシー維持）
--   * 「みんなの今週合計」は SECURITY DEFINER 関数で集計値だけ返す
--     → 個別記録は秘匿しつつ、ランキング/比較は誰でも見られる
--   * rivals は完全に「自分の中のお気に入り」。相手の同意は不要
-- ============================================================

------------------------------------------------------------
-- 1) profiles の SELECT ポリシー：全員に開く
------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_self_or_linked" ON kido.profiles;

CREATE POLICY "profiles_select_all"
  ON kido.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

------------------------------------------------------------
-- 2) rivals テーブル
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kido.rivals (
  user_id    uuid NOT NULL REFERENCES kido.profiles(id) ON DELETE CASCADE,
  rival_id   uuid NOT NULL REFERENCES kido.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, rival_id),
  CHECK (user_id <> rival_id)
);

CREATE INDEX IF NOT EXISTS rivals_user_idx ON kido.rivals (user_id);

ALTER TABLE kido.rivals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rivals_select_self" ON kido.rivals
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "rivals_insert_self" ON kido.rivals
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "rivals_delete_self" ON kido.rivals
  FOR DELETE USING (user_id = auth.uid());

GRANT SELECT, INSERT, DELETE ON kido.rivals TO authenticated;

------------------------------------------------------------
-- 3) weekly_leaderboard 関数
--    指定された期間の合計分・将棋分を全生徒について返す
--    SECURITY DEFINER で RLS をバイパスし、集計値だけ公開する
------------------------------------------------------------
CREATE OR REPLACE FUNCTION kido.weekly_leaderboard(
  start_date date,
  end_date date
)
RETURNS TABLE (
  user_id        uuid,
  display_name   text,
  role           text,
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
  GROUP BY p.id, p.display_name, p.role;
$$;

GRANT EXECUTE ON FUNCTION kido.weekly_leaderboard(date, date)
  TO authenticated, anon;
