-- auth.users 作成時に kido.profiles を自動作成する
-- raw_user_meta_data に display_name と role を入れて signup する前提

CREATE OR REPLACE FUNCTION kido.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = kido, public
AS $$
DECLARE
  v_role text;
  v_display_name text;
  v_kido_signup boolean;
BEGIN
  -- 棋道のサインアップフォーム経由でのみ profile を作る
  -- フラグは raw_user_meta_data.app = 'kido' で識別
  v_kido_signup := COALESCE(NEW.raw_user_meta_data->>'app', '') = 'kido';

  IF NOT v_kido_signup THEN
    RETURN NEW;
  END IF;

  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1)
  );

  -- 不正なロールはデフォルトに
  IF v_role NOT IN ('student', 'parent', 'teacher') THEN
    v_role := 'student';
  END IF;

  INSERT INTO kido.profiles (id, role, display_name)
  VALUES (NEW.id, v_role, v_display_name)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_kido ON auth.users;
CREATE TRIGGER on_auth_user_created_kido
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION kido.handle_new_user();
