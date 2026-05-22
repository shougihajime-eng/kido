-- ============================================================
-- 0016: 日コメント（day_comments）
-- ============================================================
-- 「練習記録がない日」にも コメント（励まし・声かけ）を残せるようにする。
--
-- データモデル:
--   - 1日 × 生徒 ごとに複数コメント
--   - 親・先生・本人 が書ける（記録コメントと同じ三者）
--   - スレッド単位は ( student_id, date ) で表す
--
-- RLS方針:
--   SELECT:
--     - 自分(=対象生徒) なら見える
--     - 紐づいた親・先生 なら見える
--     - スーパー先生 なら全員見える
--   INSERT:
--     - author_id = auth.uid() を強制
--     - author_role が自分のロールと整合（生徒は本人の日に限り、親・先生は紐づき生徒の日に限り、スーパー先生はどの生徒の日にも）
--   UPDATE:
--     - 自分が書いたコメントの content のみ
--   DELETE:
--     - 自分が書いたコメントのみ
-- ============================================================

------------------------------------------------------------
-- 1) テーブル定義
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kido.day_comments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   uuid NOT NULL REFERENCES kido.profiles(id) ON DELETE CASCADE,
  date         date NOT NULL,
  author_id    uuid REFERENCES kido.profiles(id) ON DELETE SET NULL,
  author_role  text NOT NULL CHECK (author_role IN ('student', 'parent', 'teacher')),
  content      text NOT NULL CHECK (length(content) > 0 AND length(content) <= 2000),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_day_comments_student_date
  ON kido.day_comments(student_id, date, created_at);

------------------------------------------------------------
-- 2) updated_at 自動更新トリガー
------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_day_comments_updated_at ON kido.day_comments;
CREATE TRIGGER trg_day_comments_updated_at
  BEFORE UPDATE ON kido.day_comments
  FOR EACH ROW EXECUTE FUNCTION kido.set_updated_at();

------------------------------------------------------------
-- 3) immutable keys（author_id / author_role / student_id / date / created_at は書き換え不可）
------------------------------------------------------------
CREATE OR REPLACE FUNCTION kido.day_comments_prevent_mutating_keys()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.author_id IS DISTINCT FROM OLD.author_id THEN
    RAISE EXCEPTION 'author_id is immutable';
  END IF;
  IF NEW.author_role IS DISTINCT FROM OLD.author_role THEN
    RAISE EXCEPTION 'author_role is immutable';
  END IF;
  IF NEW.student_id IS DISTINCT FROM OLD.student_id THEN
    RAISE EXCEPTION 'student_id is immutable';
  END IF;
  IF NEW.date IS DISTINCT FROM OLD.date THEN
    RAISE EXCEPTION 'date is immutable';
  END IF;
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_day_comments_immutable_keys ON kido.day_comments;
CREATE TRIGGER trg_day_comments_immutable_keys
  BEFORE UPDATE ON kido.day_comments
  FOR EACH ROW EXECUTE FUNCTION kido.day_comments_prevent_mutating_keys();

------------------------------------------------------------
-- 4) RLS
------------------------------------------------------------
ALTER TABLE kido.day_comments ENABLE ROW LEVEL SECURITY;

-- SELECT: 本人 / 紐づき大人 / スーパー先生
DROP POLICY IF EXISTS "day_comments_select_related" ON kido.day_comments;
CREATE POLICY "day_comments_select_related"
  ON kido.day_comments FOR SELECT
  USING (
    student_id = auth.uid()
    OR kido.is_linked_adult(student_id)
    OR kido.is_super_teacher()
  );

-- INSERT: author_id = auth.uid() で、ロールに応じた対象生徒か検証
DROP POLICY IF EXISTS "day_comments_insert_related" ON kido.day_comments;
CREATE POLICY "day_comments_insert_related"
  ON kido.day_comments FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND author_role IN ('student', 'parent', 'teacher')
    AND (
      -- 生徒本人: 自分の日にだけ書ける
      (author_role = 'student' AND student_id = auth.uid())
      -- 親・先生: 紐づき生徒の日に書ける、スーパー先生はどの生徒の日にも
      OR (
        author_role IN ('parent', 'teacher')
        AND (kido.is_super_teacher() OR kido.is_linked_adult(student_id))
      )
    )
  );

-- UPDATE: 自分のコメントの content のみ
DROP POLICY IF EXISTS "day_comments_update_own" ON kido.day_comments;
CREATE POLICY "day_comments_update_own"
  ON kido.day_comments FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- DELETE: 自分のコメントのみ
DROP POLICY IF EXISTS "day_comments_delete_own" ON kido.day_comments;
CREATE POLICY "day_comments_delete_own"
  ON kido.day_comments FOR DELETE
  USING (author_id = auth.uid());

------------------------------------------------------------
-- 5) 権限
------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON kido.day_comments TO authenticated;
GRANT ALL ON kido.day_comments TO service_role;
