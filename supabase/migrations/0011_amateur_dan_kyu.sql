-- ============================================================
-- 0011: アマチュアの段位／級位を別カテゴリに分離
-- ============================================================
-- 背景:
--   * これまでは「アマチュア」1択で段位（三段・四段…）も級位（1級・3級…）も
--     同じ枠で入れていた
--   * アマチュアの強い方（県代表クラス）にも気持ちよく使ってもらえるよう、
--     段位／級位を選択肢として明示的に分ける
--
-- 設計:
--   * level_kind に 'amateur_dan'（アマ段位）と 'amateur_kyu'（アマ級位）を追加
--   * 旧 'amateur' は後方互換のため CHECK 制約に残すが、フロントには出さない
--     既存データは安全のため 'amateur_dan' に寄せる（多くのアマ大会出場者は段位想定）
-- ============================================================

------------------------------------------------------------
-- 1) profiles.level_kind の CHECK 制約を更新
------------------------------------------------------------
ALTER TABLE kido.profiles
  DROP CONSTRAINT IF EXISTS profiles_level_kind_check;

ALTER TABLE kido.profiles
  ADD CONSTRAINT profiles_level_kind_check CHECK (
    level_kind IS NULL
    OR level_kind IN (
      'shoreikai',
      'joryu',
      'kenshukai',
      'amateur',       -- 旧データ後方互換
      'amateur_dan',
      'amateur_kyu',
      'other',
      'none'
    )
  );

------------------------------------------------------------
-- 2) 既存の 'amateur' を 'amateur_dan' に寄せる
------------------------------------------------------------
UPDATE kido.profiles
   SET level_kind = 'amateur_dan'
 WHERE level_kind = 'amateur';

------------------------------------------------------------
-- 3) handle_new_user 関数の CHECK を更新
------------------------------------------------------------
CREATE OR REPLACE FUNCTION kido.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = kido, public
AS $$
DECLARE
  v_role text;
  v_display_name text;
  v_synthetic_email text;
  v_level_kind text;
  v_level_text text;
  v_kido_signup boolean;
BEGIN
  v_kido_signup := COALESCE(NEW.raw_user_meta_data->>'app', '') = 'kido';

  IF NOT v_kido_signup THEN
    RETURN NEW;
  END IF;

  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );
  v_synthetic_email := NEW.raw_user_meta_data->>'synthetic_email';
  v_level_kind := NEW.raw_user_meta_data->>'level_kind';
  v_level_text := NEW.raw_user_meta_data->>'level_text';

  IF v_role NOT IN ('student', 'parent', 'teacher') THEN
    v_role := 'student';
  END IF;

  IF v_level_kind IS NOT NULL
     AND v_level_kind NOT IN (
       'shoreikai', 'joryu', 'kenshukai',
       'amateur', 'amateur_dan', 'amateur_kyu',
       'other', 'none'
     ) THEN
    v_level_kind := NULL;
  END IF;

  -- 旧データ互換: amateur のままなら amateur_dan に寄せる
  IF v_level_kind = 'amateur' THEN
    v_level_kind := 'amateur_dan';
  END IF;

  INSERT INTO kido.profiles (id, role, display_name, synthetic_email, level_kind, level_text)
  VALUES (NEW.id, v_role, v_display_name, v_synthetic_email, v_level_kind, NULLIF(v_level_text, ''))
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
