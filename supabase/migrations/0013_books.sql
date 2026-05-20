-- ============================================================
-- 0013: 棋書本棚（教材管理）
-- ============================================================
-- 設計:
--   * 生徒が自分の本棚に「使っている棋書」を登録
--   * 各本に絵文字アイコン＋タイトル＋status（reading/done/paused）
--   * training_records.book_id（オプション）でその本で勉強した時間を紐づけ
--   * 「この本で何時間使った」を集計表示できる
-- ============================================================

CREATE TABLE IF NOT EXISTS kido.books (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES kido.profiles(id) ON DELETE CASCADE,
  title       text NOT NULL CHECK (length(title) > 0 AND length(title) <= 80),
  author      text CHECK (length(author) <= 60),
  emoji       text NOT NULL DEFAULT '📘' CHECK (length(emoji) <= 8),
  status      text NOT NULL DEFAULT 'reading'
               CHECK (status IN ('reading', 'done', 'paused')),
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS books_user_idx ON kido.books (user_id, sort_order, created_at);

CREATE TRIGGER trg_books_updated_at
  BEFORE UPDATE ON kido.books
  FOR EACH ROW EXECUTE FUNCTION kido.set_updated_at();

------------------------------------------------------------
-- training_records に book_id（オプション）を追加
------------------------------------------------------------
ALTER TABLE kido.training_records
  ADD COLUMN IF NOT EXISTS book_id uuid REFERENCES kido.books(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS training_records_book_idx
  ON kido.training_records (book_id)
  WHERE book_id IS NOT NULL;

------------------------------------------------------------
-- RLS
------------------------------------------------------------
ALTER TABLE kido.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "books_select_self_or_linked"
  ON kido.books FOR SELECT
  USING (
    user_id = auth.uid()
    OR kido.is_linked_adult(user_id)
    OR kido.is_super_teacher()
  );

CREATE POLICY "books_insert_self"
  ON kido.books FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "books_update_self"
  ON kido.books FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "books_delete_self"
  ON kido.books FOR DELETE
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON kido.books TO authenticated;
