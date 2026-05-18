-- ============================================================
-- 0005: 名前 + 4桁合言葉 ログインに切り替える
-- ============================================================
-- 設計:
--   - 表向きの認証情報は「なまえ」と「4桁の合言葉」だけ
--   - 中では Supabase Auth をそのまま使い続ける
--     - 内部用メールアドレス: <uuid>@kido.local
--     - 内部用パスワード: kido-pin-<PIN>-v1
--   - profiles.synthetic_email で「なまえ → 内部メアド」の引き当てを実現
--   - profiles.display_name は世界で 1 つだけ（ログイン時の検索キー）
--
-- 互換性: メアド方式の既存テストデータは全削除する（はじめさんの了解済）
-- ============================================================

------------------------------------------------------------
-- 1) 既存テストデータの完全クリーンアップ
------------------------------------------------------------
-- auth.users を消すと kido.profiles などが ON DELETE CASCADE で消える
-- kido に属するアカウントのみ削除（kido 以外のプロジェクトのアカウントは触らない）
DELETE FROM auth.users
WHERE id IN (SELECT id FROM kido.profiles);

------------------------------------------------------------
-- 2) profiles に synthetic_email を追加
------------------------------------------------------------
ALTER TABLE kido.profiles
  ADD COLUMN IF NOT EXISTS synthetic_email text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_synthetic_email_unique
  ON kido.profiles (synthetic_email)
  WHERE synthetic_email IS NOT NULL;

------------------------------------------------------------
-- 3) display_name の世界で 1 つ制約
------------------------------------------------------------
-- ※既存データを全削除した直後なので衝突は起きない
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_display_name_unique'
      AND conrelid = 'kido.profiles'::regclass
  ) THEN
    ALTER TABLE kido.profiles
      ADD CONSTRAINT profiles_display_name_unique UNIQUE (display_name);
  END IF;
END $$;

------------------------------------------------------------
-- 4) handle_new_user トリガーの更新
------------------------------------------------------------
-- raw_user_meta_data.synthetic_email を読み取り、profiles.synthetic_email にセット
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

  IF v_role NOT IN ('student', 'parent', 'teacher') THEN
    v_role := 'student';
  END IF;

  INSERT INTO kido.profiles (id, role, display_name, synthetic_email)
  VALUES (NEW.id, v_role, v_display_name, v_synthetic_email)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- トリガー自体は再作成不要（関数の中身だけ更新された）
