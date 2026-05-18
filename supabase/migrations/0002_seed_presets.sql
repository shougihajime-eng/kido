-- プリセット練習カテゴリ8種 + 初期バッジ
-- key は code 側からの参照用の安定識別子。is_preset=TRUE で全ユーザーから可視。

------------------------------------------------------------
-- カテゴリ 8 種
------------------------------------------------------------
INSERT INTO kido.categories (key, owner_id, name_ja, icon_key, color_token, is_preset, sort_order) VALUES
  ('kifu_narabe', NULL, '棋譜並べ',   'scroll', 'cat-kifu',  TRUE, 1),
  ('tsume_shogi', NULL, '詰将棋',     'tsume',  'cat-tsume', TRUE, 2),
  ('jissen',      NULL, '実戦',       'clock',  'cat-game',  TRUE, 3),
  ('kenkyukai',   NULL, '研究会',     'users',  'cat-study', TRUE, 4),
  ('vs',          NULL, 'VS',         'swords', 'cat-vs',    TRUE, 5),
  ('ai_kenkyu',   NULL, 'AI研究',     'cpu',    'cat-ai',    TRUE, 6),
  ('joseki',      NULL, '定跡研究',   'book',   'cat-book',  TRUE, 7),
  ('other',       NULL, 'その他',     'plus',   'cat-other', TRUE, 99)
ON CONFLICT (key) DO NOTHING;

------------------------------------------------------------
-- 初期バッジ（criteria_json は将来 Phase G で自動判定に使う）
------------------------------------------------------------
INSERT INTO kido.badges (id, name, description, icon_key, criteria_json) VALUES
  ('streak_7',    '一週間皆勤',     '7日連続で記録した', 'flame',  '{"type":"streak","value":7}'::jsonb),
  ('streak_30',   '一ヶ月皆勤',     '30日連続で記録した', 'flame', '{"type":"streak","value":30}'::jsonb),
  ('streak_100',  '百日連続',       '100日連続で記録した', 'flame','{"type":"streak","value":100}'::jsonb),
  ('total_10h',   '10時間到達',     '通算10時間練習した', 'star', '{"type":"total_minutes","value":600}'::jsonb),
  ('total_100h',  '100時間到達',    '通算100時間練習した', 'star','{"type":"total_minutes","value":6000}'::jsonb),
  ('total_1000h', '千時間到達',     '通算1000時間練習した', 'crown','{"type":"total_minutes","value":60000}'::jsonb),
  ('tsume_50h',   '詰将棋50時間',   '詰将棋を通算50時間', 'tsume','{"type":"category_minutes","category":"tsume_shogi","value":3000}'::jsonb),
  ('jissen_50h',  '実戦50時間',     '実戦を通算50時間', 'clock','{"type":"category_minutes","category":"jissen","value":3000}'::jsonb),
  ('week_full',   '週7日達成',      '1週間すべての曜日で記録した', 'check','{"type":"week_complete"}'::jsonb)
ON CONFLICT (id) DO NOTHING;
