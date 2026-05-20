-- ============================================================
-- 0014: Web Push 通知の購読情報
-- ============================================================
-- 設計:
--   * 1ユーザー × 複数端末（同じユーザーがスマホ＋PCで購読可能）
--   * endpoint がユニーク（同じブラウザは1つだけ）
--   * RLS: 本人だけが自分の購読を見られる
-- ============================================================

CREATE TABLE IF NOT EXISTS kido.push_subscriptions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES kido.profiles(id) ON DELETE CASCADE,
  endpoint     text NOT NULL UNIQUE,
  p256dh       text NOT NULL,
  auth         text NOT NULL,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx
  ON kido.push_subscriptions (user_id);

ALTER TABLE kido.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_select_self"
  ON kido.push_subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "push_insert_self"
  ON kido.push_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_delete_self"
  ON kido.push_subscriptions FOR DELETE
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, DELETE ON kido.push_subscriptions TO authenticated;
