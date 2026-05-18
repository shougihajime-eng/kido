-- Phase D: メンタル記録 + 対局結果テーブル
-- mood_logs と game_results を追加し、RLS を有効化

------------------------------------------------------------
-- mood_logs：1日1件の気分・体調記録
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kido.mood_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES kido.profiles(id) ON DELETE CASCADE,
  date         date NOT NULL,
  score        integer NOT NULL CHECK (score BETWEEN 1 AND 5),
  energy       integer CHECK (energy BETWEEN 1 AND 5),
  memo         text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_mood_user_date ON kido.mood_logs(user_id, date DESC);

DROP TRIGGER IF EXISTS trg_mood_logs_updated_at ON kido.mood_logs;
CREATE TRIGGER trg_mood_logs_updated_at
  BEFORE UPDATE ON kido.mood_logs
  FOR EACH ROW EXECUTE FUNCTION kido.set_updated_at();

ALTER TABLE kido.mood_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mood_select_self_or_linked" ON kido.mood_logs;
CREATE POLICY "mood_select_self_or_linked"
  ON kido.mood_logs FOR SELECT
  USING (user_id = auth.uid() OR kido.is_linked_adult(user_id));

DROP POLICY IF EXISTS "mood_modify_self" ON kido.mood_logs;
CREATE POLICY "mood_modify_self"
  ON kido.mood_logs FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

------------------------------------------------------------
-- game_results：実戦カテゴリのレコードに紐づく勝敗・戦型
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kido.game_results (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_record_id    uuid NOT NULL REFERENCES kido.training_records(id) ON DELETE CASCADE,
  user_id               uuid NOT NULL REFERENCES kido.profiles(id) ON DELETE CASCADE,
  result                text NOT NULL CHECK (result IN ('win', 'loss', 'draw', 'jisho')),
  opening_tag           text,
  opponent_name         text,
  time_control_minutes  integer CHECK (time_control_minutes IS NULL OR time_control_minutes > 0),
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (training_record_id)
);

CREATE INDEX IF NOT EXISTS idx_game_results_user ON kido.game_results(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_results_record ON kido.game_results(training_record_id);

ALTER TABLE kido.game_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "games_select_self_or_linked" ON kido.game_results;
CREATE POLICY "games_select_self_or_linked"
  ON kido.game_results FOR SELECT
  USING (user_id = auth.uid() OR kido.is_linked_adult(user_id));

DROP POLICY IF EXISTS "games_modify_self" ON kido.game_results;
CREATE POLICY "games_modify_self"
  ON kido.game_results FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

------------------------------------------------------------
-- 権限
------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON kido.mood_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON kido.game_results TO authenticated;
GRANT ALL ON kido.mood_logs TO service_role;
GRANT ALL ON kido.game_results TO service_role;
