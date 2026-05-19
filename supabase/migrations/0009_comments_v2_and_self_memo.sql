-- ============================================================
-- 0009: コメント双方向化・編集・絵文字リアクション + 自己メモ
-- ============================================================
-- 設計:
--   1) comments を全員書き込み可に開く
--      - 生徒: 自分の記録 にコメント可
--      - 親・先生: 紐づいた生徒の記録 にコメント可
--      - スーパー先生: 全員の記録 にコメント可
--      - author_role は本人のロールと一致する必要あり
--   2) 自分のコメントは いつでも 編集可（content のみ。author_id/record_id は固定）
--      - updated_at 列追加。書き換え時に自動更新。
--      - 「edited」表示は updated_at と created_at の差で判定（フロント側）
--   3) comment_reactions テーブル
--      - 1コメント x 1ユーザー x 1絵文字 で UNIQUE
--      - 6 絵文字: 👍❤️🔥🎉👏🙏（フロント側で固定。DB は emoji text を素直に格納）
--      - SELECT: そのコメントが見られる人なら見られる
--      - INSERT/DELETE: 自分のリアクションのみ
--   4) training_records.self_memo
--      - 「本人だけが見える」自由メモ。memo は引き続き公開メモ。
--      - SELECT で他者から見えないように、列レベルで返さない運用にする（RLS だけでは列単位は守れないので、アプリ側で生徒以外には select しない）
-- ============================================================

------------------------------------------------------------
-- 1) comments に updated_at を追加 + 自動更新トリガー
------------------------------------------------------------
ALTER TABLE kido.comments
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS trg_comments_updated_at ON kido.comments;
CREATE TRIGGER trg_comments_updated_at
  BEFORE UPDATE ON kido.comments
  FOR EACH ROW EXECUTE FUNCTION kido.set_updated_at();

------------------------------------------------------------
-- 2) comments の INSERT ポリシーを再定義（生徒も書ける）
------------------------------------------------------------
DROP POLICY IF EXISTS "comments_insert_linked_adult" ON kido.comments;
DROP POLICY IF EXISTS "comments_insert_related" ON kido.comments;

CREATE POLICY "comments_insert_related"
  ON kido.comments FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND author_role IN ('student', 'parent', 'teacher')
    AND (
      -- 生徒本人: 自分の記録なら書ける
      (
        author_role = 'student'
        AND EXISTS (
          SELECT 1 FROM kido.training_records r
          WHERE r.id = record_id AND r.user_id = auth.uid()
        )
      )
      -- 親・先生: 紐づいた生徒の記録なら書ける、スーパー先生は全員可
      OR (
        author_role IN ('parent', 'teacher')
        AND (
          kido.is_super_teacher()
          OR EXISTS (
            SELECT 1 FROM kido.training_records r
            WHERE r.id = record_id
            AND kido.is_linked_adult(r.user_id)
          )
        )
      )
    )
  );

------------------------------------------------------------
-- 3) comments の UPDATE ポリシー（自分の content のみ）
------------------------------------------------------------
DROP POLICY IF EXISTS "comments_update_own" ON kido.comments;
CREATE POLICY "comments_update_own"
  ON kido.comments FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (
    author_id = auth.uid()
    -- author_role は変えさせない（OLD = NEW を保証する仕組みはトリガで）
  );

-- 「author_role / record_id / author_id は書き換え不可」を強制するトリガ
CREATE OR REPLACE FUNCTION kido.comments_prevent_mutating_keys()
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
  IF NEW.record_id IS DISTINCT FROM OLD.record_id THEN
    RAISE EXCEPTION 'record_id is immutable';
  END IF;
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    -- 作成日も書き換えさせない
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_comments_immutable_keys ON kido.comments;
CREATE TRIGGER trg_comments_immutable_keys
  BEFORE UPDATE ON kido.comments
  FOR EACH ROW EXECUTE FUNCTION kido.comments_prevent_mutating_keys();

------------------------------------------------------------
-- 4) comment_reactions テーブル（絵文字リアクション）
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kido.comment_reactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id  uuid NOT NULL REFERENCES kido.comments(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES kido.profiles(id) ON DELETE CASCADE,
  emoji       text NOT NULL CHECK (length(emoji) BETWEEN 1 AND 16),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment
  ON kido.comment_reactions(comment_id);

ALTER TABLE kido.comment_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reactions_select_related" ON kido.comment_reactions;
CREATE POLICY "reactions_select_related"
  ON kido.comment_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM kido.comments c
      JOIN kido.training_records r ON r.id = c.record_id
      WHERE c.id = comment_reactions.comment_id
        AND (
          r.user_id = auth.uid()
          OR kido.is_linked_adult(r.user_id)
          OR kido.is_super_teacher()
        )
    )
  );

DROP POLICY IF EXISTS "reactions_insert_self" ON kido.comment_reactions;
CREATE POLICY "reactions_insert_self"
  ON kido.comment_reactions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM kido.comments c
      JOIN kido.training_records r ON r.id = c.record_id
      WHERE c.id = comment_reactions.comment_id
        AND (
          r.user_id = auth.uid()
          OR kido.is_linked_adult(r.user_id)
          OR kido.is_super_teacher()
        )
    )
  );

DROP POLICY IF EXISTS "reactions_delete_self" ON kido.comment_reactions;
CREATE POLICY "reactions_delete_self"
  ON kido.comment_reactions FOR DELETE
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, DELETE ON kido.comment_reactions
  TO authenticated;

------------------------------------------------------------
-- 5) training_records.self_memo（本人だけが見える）
------------------------------------------------------------
ALTER TABLE kido.training_records
  ADD COLUMN IF NOT EXISTS self_memo text;

-- 注: self_memo の列レベル秘匿は RLS では行えない。
-- アプリ側で「自分以外には self_memo を select しない」運用を徹底する。
-- 親・先生・スーパー先生が training_records を SELECT したとき self_memo が
-- 返らないように、専用ビューを作って読み分けてもよい（今回はアプリ層で吸収）。

------------------------------------------------------------
-- 6) 念のため権限を再付与
------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA kido
  TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA kido TO service_role;
