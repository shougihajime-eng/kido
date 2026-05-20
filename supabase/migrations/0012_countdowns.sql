-- ============================================================
-- 0012: カウントダウン（次の◯まであと△日）
-- ============================================================
-- 設計:
--   * 生徒が自分でカウントダウン目標日を登録
--     例: 「奨励会試験」2026-08-15、「○○杯」2026-06-10 など
--   * ダッシュボードに最も近いカウントダウンを表示
--   * 各カウントダウンは絵文字＋タイトル＋日付の3点で表現
--   * 過去日はカウントダウン対象から外す（クライアント側で）
-- ============================================================

CREATE TABLE IF NOT EXISTS kido.countdowns (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES kido.profiles(id) ON DELETE CASCADE,
  title        text NOT NULL CHECK (length(title) > 0 AND length(title) <= 40),
  target_date  date NOT NULL,
  emoji        text NOT NULL DEFAULT '📅' CHECK (length(emoji) <= 8),
  color_token  text NOT NULL DEFAULT 'accent',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS countdowns_user_date_idx
  ON kido.countdowns (user_id, target_date);

CREATE TRIGGER trg_countdowns_updated_at
  BEFORE UPDATE ON kido.countdowns
  FOR EACH ROW EXECUTE FUNCTION kido.set_updated_at();

------------------------------------------------------------
-- RLS: 本人＋linked adult＋super_teacher 読取、本人のみ書込
------------------------------------------------------------
ALTER TABLE kido.countdowns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "countdowns_select_self_or_linked"
  ON kido.countdowns FOR SELECT
  USING (
    user_id = auth.uid()
    OR kido.is_linked_adult(user_id)
    OR kido.is_super_teacher()
  );

CREATE POLICY "countdowns_insert_self"
  ON kido.countdowns FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "countdowns_update_self"
  ON kido.countdowns FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "countdowns_delete_self"
  ON kido.countdowns FOR DELETE
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON kido.countdowns TO authenticated;
