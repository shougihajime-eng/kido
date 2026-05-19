-- 生活カテゴリーの追加
-- 「将棋に集中する」アプリの軸はそのままに、サボった時間も見える化する
-- 将棋カテゴリーと区別するため kind 列を追加（shogi / life）
-- 連続日数🔥・全体目標・バッジは「shogi」だけを対象にする方針（実装側で対応）

------------------------------------------------------------
-- 1) kind 列を追加
------------------------------------------------------------
ALTER TABLE kido.categories
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'shogi'
    CHECK (kind IN ('shogi', 'life'));

-- 既存プリセットは全て shogi（デフォルトのまま）。明示しておく
UPDATE kido.categories SET kind = 'shogi'
  WHERE is_preset = TRUE AND kind = 'shogi';

------------------------------------------------------------
-- 2) 生活カテゴリー6種を追加
--    sort_order は 101〜 で将棋カテゴリー（1〜8, 99）の後ろに並ぶ
------------------------------------------------------------
INSERT INTO kido.categories (key, owner_id, name_ja, icon_key, color_token, is_preset, sort_order, kind) VALUES
  ('life_school',   NULL, '学校・勉強',           'graduation-cap', 'cat-life-school',   TRUE, 101, 'life'),
  ('life_sleep',    NULL, '睡眠',                 'moon',           'cat-life-sleep',    TRUE, 102, 'life'),
  ('life_meal',     NULL, '食事',                 'utensils',       'cat-life-meal',     TRUE, 103, 'life'),
  ('life_play',     NULL, '遊び・休憩',           'gamepad',        'cat-life-play',     TRUE, 104, 'life'),
  ('life_exercise', NULL, '運動・お風呂',         'dumbbell',       'cat-life-exercise', TRUE, 105, 'life'),
  ('life_screen',   NULL, 'スマホ・テレビ・ゲーム', 'smartphone',     'cat-life-screen',   TRUE, 106, 'life')
ON CONFLICT (key) DO NOTHING;
