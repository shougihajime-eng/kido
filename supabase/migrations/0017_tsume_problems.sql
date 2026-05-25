-- ============================================================
-- 0017: 詰将棋の問題（tsume_problems）
-- ============================================================
-- これまで詰将棋は lib/tsume.ts にコードとして埋め込んでいたが、
-- 「先生が管理画面から自由に作って・直して・公開できる」ようにするため
-- データベースのテーブルに移す。
--
-- データモデル:
--   - 1行 = 1問の詰将棋
--   - frames は「1手ごとの盤面（SFEN）」の配列。指で解くときに使う
--   - published = true の問題だけが生徒・保護者に出る
--
-- RLS方針:
--   SELECT:
--     - published = true なら誰でも（生徒・保護者・先生）見える
--     - 先生は下書き（published = false）も見える
--   INSERT / UPDATE / DELETE:
--     - 先生（role = 'teacher'）だけ
-- ============================================================

------------------------------------------------------------
-- 1) テーブル定義
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kido.tsume_problems (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text,
  tesuu        integer NOT NULL CHECK (tesuu >= 1 AND tesuu <= 99),
  level        text NOT NULL DEFAULT 'normal'
                 CHECK (level IN ('demo', 'easy', 'normal', 'hard', 'master')),
  start_sfen   text NOT NULL,
  final_sfen   text NOT NULL,
  moves_ja     text[] NOT NULL DEFAULT '{}',
  moves_usi    text[] NOT NULL DEFAULT '{}',
  frames       text[] NOT NULL DEFAULT '{}',
  composer     text,
  source       text,
  note         text,
  published    boolean NOT NULL DEFAULT false,
  sort_order   integer NOT NULL DEFAULT 0,
  created_by   uuid REFERENCES kido.profiles(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tsume_problems_published
  ON kido.tsume_problems(published, sort_order, created_at);

------------------------------------------------------------
-- 2) updated_at 自動更新トリガー
------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_tsume_problems_updated_at ON kido.tsume_problems;
CREATE TRIGGER trg_tsume_problems_updated_at
  BEFORE UPDATE ON kido.tsume_problems
  FOR EACH ROW EXECUTE FUNCTION kido.set_updated_at();

------------------------------------------------------------
-- 3) RLS
------------------------------------------------------------
ALTER TABLE kido.tsume_problems ENABLE ROW LEVEL SECURITY;

-- SELECT: 公開済みは全員 / 先生は下書きも
DROP POLICY IF EXISTS "tsume_select_published_or_teacher" ON kido.tsume_problems;
CREATE POLICY "tsume_select_published_or_teacher"
  ON kido.tsume_problems FOR SELECT
  USING (published = TRUE OR kido.has_role('teacher'));

-- INSERT: 先生だけ（created_by は本人）
DROP POLICY IF EXISTS "tsume_insert_teacher" ON kido.tsume_problems;
CREATE POLICY "tsume_insert_teacher"
  ON kido.tsume_problems FOR INSERT
  WITH CHECK (kido.has_role('teacher') AND created_by = auth.uid());

-- UPDATE: 先生だけ
DROP POLICY IF EXISTS "tsume_update_teacher" ON kido.tsume_problems;
CREATE POLICY "tsume_update_teacher"
  ON kido.tsume_problems FOR UPDATE
  USING (kido.has_role('teacher'))
  WITH CHECK (kido.has_role('teacher'));

-- DELETE: 先生だけ
DROP POLICY IF EXISTS "tsume_delete_teacher" ON kido.tsume_problems;
CREATE POLICY "tsume_delete_teacher"
  ON kido.tsume_problems FOR DELETE
  USING (kido.has_role('teacher'));

------------------------------------------------------------
-- 4) 権限
------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON kido.tsume_problems TO authenticated;
GRANT ALL ON kido.tsume_problems TO service_role;

------------------------------------------------------------
-- 5) 初期投入（これまでの 9 問・コンピューター作成検証済み）
--    テーブルが空のときだけ入れる（再実行しても重複しない）
------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM kido.tsume_problems) THEN
    INSERT INTO kido.tsume_problems
      (tesuu, level, source, published, sort_order, start_sfen, final_sfen, moves_ja, moves_usi, frames)
    VALUES
      (3, 'easy', 'コンピューター作成・検証済み', TRUE, 10,
       '9/9/k8/9/9/GSR6/9/9/8K b GS 1',
       '9/kG7/2+R6/9/9/GS7/9/9/8K w S 4',
       ARRAY['▲７三飛成','△９二玉','▲８二金打'],
       ARRAY['7f7c+','9c9b','G*8b'],
       ARRAY['9/9/k8/9/9/GSR6/9/9/8K b GS 1','9/9/k1+R6/9/9/GS7/9/9/8K w GS 2','9/k8/2+R6/9/9/GS7/9/9/8K b GS 3','9/kG7/2+R6/9/9/GS7/9/9/8K w S 4']),

      (3, 'easy', 'コンピューター作成・検証済み', TRUE, 20,
       '4k1G2/9/6R2/4B4/9/9/9/9/K8 b SN 1',
       '3k2G2/2S6/4+R4/4B4/9/9/9/9/K8 w N 4',
       ARRAY['▲５三飛成','△６一玉','▲７二銀打'],
       ARRAY['3c5c+','5a6a','S*7b'],
       ARRAY['4k1G2/9/6R2/4B4/9/9/9/9/K8 b SN 1','4k1G2/9/4+R4/4B4/9/9/9/9/K8 w SN 2','3k2G2/9/4+R4/4B4/9/9/9/9/K8 b SN 3','3k2G2/2S6/4+R4/4B4/9/9/9/9/K8 w N 4']),

      (3, 'easy', 'コンピューター作成・検証済み', TRUE, 30,
       'k8/1L7/9/1G7/9/9/9/9/8K b GS 1',
       '1G7/kL7/S8/1G7/9/9/9/9/8K w - 4',
       ARRAY['▲８一金打','△９二玉','▲９三銀打'],
       ARRAY['G*8a','9a9b','S*9c'],
       ARRAY['k8/1L7/9/1G7/9/9/9/9/8K b GS 1','kG7/1L7/9/1G7/9/9/9/9/8K w S 2','1G7/kL7/9/1G7/9/9/9/9/8K b S 3','1G7/kL7/S8/1G7/9/9/9/9/8K w - 4']),

      (3, 'easy', 'コンピューター作成・検証済み', TRUE, 40,
       '9/k8/2G6/9/9/9/9/9/8K b GN 1',
       'k8/1G7/2G6/9/9/9/9/9/8K w N 4',
       ARRAY['▲８三金打','△９一玉','▲８二金'],
       ARRAY['G*8c','9b9a','8c8b'],
       ARRAY['9/k8/2G6/9/9/9/9/9/8K b GN 1','9/k8/1GG6/9/9/9/9/9/8K w N 2','k8/9/1GG6/9/9/9/9/9/8K b N 3','k8/1G7/2G6/9/9/9/9/9/8K w N 4']),

      (5, 'normal', 'コンピューター作成・検証済み', TRUE, 50,
       '9/9/7k1/5BS2/9/5B3/9/9/1K7 b - 1',
       '7k1/7+S1/6+B2/9/9/5B3/9/9/1K7 w - 6',
       ARRAY['▲３三角成','△１二玉','▲２三銀','△２一玉','▲２二銀成'],
       ARRAY['4d3c+','2c1b','3d2c','1b2a','2c2b+'],
       ARRAY['9/9/7k1/5BS2/9/5B3/9/9/1K7 b - 1','9/9/6+Bk1/6S2/9/5B3/9/9/1K7 w - 2','9/8k/6+B2/6S2/9/5B3/9/9/1K7 b - 3','9/8k/6+BS1/9/9/5B3/9/9/1K7 w - 4','7k1/9/6+BS1/9/9/5B3/9/9/1K7 b - 5','7k1/7+S1/6+B2/9/9/5B3/9/9/1K7 w - 6']),

      (5, 'normal', 'コンピューター作成・検証済み', TRUE, 60,
       '9/9/kN7/2G6/B8/9/9/9/K8 b GL 1',
       'G8/1k7/1NG6/1B7/9/9/9/9/K8 w L 6',
       ARRAY['▲８四角','△９二玉','▲９一金打','△８二玉','▲７三金'],
       ARRAY['9e8d','9c9b','G*9a','9b8b','7d7c'],
       ARRAY['9/9/kN7/2G6/B8/9/9/9/K8 b GL 1','9/9/kN7/1BG6/9/9/9/9/K8 w GL 2','9/k8/1N7/1BG6/9/9/9/9/K8 b GL 3','G8/k8/1N7/1BG6/9/9/9/9/K8 w L 4','G8/1k7/1N7/1BG6/9/9/9/9/K8 b L 5','G8/1k7/1NG6/1B7/9/9/9/9/K8 w L 6']),

      (5, 'normal', 'コンピューター作成・検証済み', TRUE, 70,
       '9/9/8k/6G2/6G2/9/9/K8/9 b G 1',
       '6k2/6G2/6G2/7G1/9/9/9/K8/9 w - 6',
       ARRAY['▲２四金','△２二玉','▲３三金','△３一玉','▲３二金打'],
       ARRAY['3e2d','1c2b','3d3c','2b3a','G*3b'],
       ARRAY['9/9/8k/6G2/6G2/9/9/K8/9 b G 1','9/9/8k/6GG1/9/9/9/K8/9 w G 2','9/7k1/9/6GG1/9/9/9/K8/9 b G 3','9/7k1/6G2/7G1/9/9/9/K8/9 w G 4','6k2/9/6G2/7G1/9/9/9/K8/9 b G 5','6k2/6G2/6G2/7G1/9/9/9/K8/9 w - 6']),

      (5, 'normal', 'コンピューター作成・検証済み', TRUE, 80,
       '9/6k2/8G/9/4R2R1/9/9/9/8K b - 1',
       '4R1k2/9/5+R2G/9/9/9/9/9/8K w - 6',
       ARRAY['▲２三飛成','△４一玉','▲４三龍','△３一玉','▲５一飛'],
       ARRAY['2e2c+','3b4a','2c4c','4a3a','5e5a'],
       ARRAY['9/6k2/8G/9/4R2R1/9/9/9/8K b - 1','9/6k2/7+RG/9/4R4/9/9/9/8K w - 2','5k3/9/7+RG/9/4R4/9/9/9/8K b - 3','5k3/9/5+R2G/9/4R4/9/9/9/8K w - 4','6k2/9/5+R2G/9/4R4/9/9/9/8K b - 5','4R1k2/9/5+R2G/9/9/9/9/9/8K w - 6']),

      (5, 'normal', 'コンピューター作成・検証済み', TRUE, 90,
       '9/7k1/5N3/7G1/6G2/9/9/9/K8 b GN 1',
       '5k3/5+N3/5NG2/7G1/6G2/9/9/9/K8 w - 6',
       ARRAY['▲３四桂打','△３二玉','▲３三金打','△４一玉','▲４二桂成'],
       ARRAY['N*3d','2b3b','G*3c','3b4a','3d4b+'],
       ARRAY['9/7k1/5N3/7G1/6G2/9/9/9/K8 b GN 1','9/7k1/5N3/6NG1/6G2/9/9/9/K8 w G 2','9/6k2/5N3/6NG1/6G2/9/9/9/K8 b G 3','9/6k2/5NG2/6NG1/6G2/9/9/9/K8 w - 4','5k3/9/5NG2/6NG1/6G2/9/9/9/K8 b - 5','5k3/5+N3/5NG2/7G1/6G2/9/9/9/K8 w - 6']);
  END IF;
END $$;
