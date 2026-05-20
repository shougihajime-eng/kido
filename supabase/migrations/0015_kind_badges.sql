-- ============================================================
-- 0015_kind_badges.sql
--   「やってない子が嫌な気持ちにならず、やる気になる」優しいバッジ 10 個を追加。
--   既存の高ハードルな bagde（百日／千時間など）と並行して、
--   1日目から取れる「最初の一歩」系・「おかえり」系・「気持ち」系を充実させる。
--
--   全部 'star' アイコンで登録するが、フロントの BadgeShelf 側で
--   icon_key ベースの色／表情マッピングをかける。
-- ============================================================

INSERT INTO kido.badges (id, name, description, icon_key, criteria_json) VALUES
  -- 🌱 すぐ取れる「最初の一歩」系（誰でも初日に取れる）
  ('first_record',
    'はじめの一歩',
    '1分でも初めて記録した',
    'sprout',
    '{"type":"first_record"}'::jsonb),
  ('welcome',
    'ようこそ',
    '棋道へようこそ！アカウントを作ってくれてありがとう',
    'sparkles',
    '{"type":"welcome"}'::jsonb),
  ('first_self_memo',
    '気持ちを書いた',
    '自分だけのメモを初めて書いた',
    'heart',
    '{"type":"first_self_memo"}'::jsonb),

  -- 🌸 休んでも責めない「おかえり」系
  ('comeback_7',
    'おかえり',
    '1週間お休みしたあと、また戻ってきた',
    'heart',
    '{"type":"comeback_after_days","value":7}'::jsonb),
  ('comeback_14',
    'また会えたね',
    '2週間以上空けて戻ってきた',
    'heart',
    '{"type":"comeback_after_days","value":14}'::jsonb),
  ('monthly_active_8',
    'マイペース',
    '1ヶ月のうち8日以上、自分のペースで続けている',
    'check',
    '{"type":"monthly_active","days":8,"window_days":30}'::jsonb),

  -- ☀️ 時間じゃなく「気持ち」を褒める系
  ('morning_person',
    '朝の人',
    '朝（5〜9時）に練習した',
    'sun',
    '{"type":"time_of_day","start_hour":5,"end_hour":9}'::jsonb),
  ('night_owl',
    '夜の人',
    '夜（21時以降）に練習した',
    'moon',
    '{"type":"time_of_day","start_hour":21,"end_hour":24}'::jsonb),
  ('linked_first_adult',
    'ありがとう',
    '親・先生と紐づいた',
    'users',
    '{"type":"has_relationship"}'::jsonb),
  ('personal_best_week',
    '自分新記録',
    '先週の自分より、今週がんばった',
    'trending-up',
    '{"type":"week_over_week"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_key = EXCLUDED.icon_key,
  criteria_json = EXCLUDED.criteria_json;
