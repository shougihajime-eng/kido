@AGENTS.md

# 棋道 (kido) — プロジェクト概要

将棋のプロ棋士・女流棋士を志す生徒（奨励会員・女流棋士志望）が「毎日開きたくなる」トレーニング記録アプリ。
**Strava の将棋版、Duolingo の将棋版** を目指す。

---

## 進捗（いまここ）

- ✅ **直近で済んだこと**（2026-05-19）: **Phase A・B・C・D・E・F 完了！**
  - **Phase A**: 基盤（Next.js 16・PWA・Supabase接続・GitHub・Vercel）
  - **Phase B**: 親子・先生紐づけ
    - `/code` — 生徒が招待コード発行（8文字 `ABCD-1234` 形式）
    - `/family` — 親・先生のホーム（紐づいた生徒一覧）
    - `/family/link` — 招待コード入力で紐づけ
    - `/family/[studentId]` — 生徒個別の閲覧画面
  - **Phase C**: コア記録機能
    - `/record` — 3ステップウィザード（カテゴリ → 分 → 確認）
    - プリセット 9種（10/15/20/30/45/60/90/120/180 分）
    - 紙吹雪エフェクト + 棋道らしい完了演出
  - **Phase D**: ダッシュボード
    - 今日の合計（カウントアップ + 金色グロー）
    - 連続日数 🔥（炎が揺れるアニメ + 「今日記録するとキープ！」警告）
    - 今週合計・週間棒グラフ・カテゴリ別内訳バー
    - 今日の記録リスト + 親・先生招待カード
  - **Phase E**: カレンダー + 分析
    - `/calendar` — 26週ヒートマップ（5段階濃度・タップで記録プレビュー）
    - `/analysis` — 期間切替（7/30/90日）+ KPI 4枚 + 日次推移エリアチャート + カテゴリ円グラフ + 時間帯棒グラフ
    - `/follow` — 仲間フィード骨組み
    - `/profile` — プロフィール表示
  - **Phase F**: 親・先生機能（紐づけた生徒の閲覧）
  - **目標機能**（週・月）
    - `/goals` — 一覧（プログレスバー・残り日数・1日あたりペース表示）／追加（期間×カテゴリ×目標時間）／削除
    - ダッシュボードに「今週/月の目標」進捗カード（達成時は緑＋チェックマーク）
    - BottomNav に「目標」タブ追加（旧「仲間」と入れ替え）
  - **コメント機能**（親・先生 → 生徒）
    - `/family/[studentId]` で各記録に対するコメント一覧＋入力フォーム（展開・収納）
    - 生徒ダッシュボードに「親・先生からのコメント」セクション（最新5件）
    - 「今日の記録」にコメント件数バッジ
    - 著者バッジ（親=藍 / 先生=金 / AI=水色）と相対時刻表示
    - 自分のコメントは削除可能（RLS で守られている）
  - ロール別自動振り分け（生徒 → `/dashboard`、親・先生 → `/family`）
  - 学生用 BottomNav + 大人用 AdultBottomNav
- 🟡 **進行中**: なし
- 🔜 **次の一歩（候補）**: 1) 本番でフル機能を実機確認、2) Phase G（AIコメント機能・Anthropic API キー必要）、3) 悩み相談（diary_entries）

---

## 本番URL / ステージング / 管理画面URL

| 用途               | URL                                                         | 備考                                   |
| ------------------ | ----------------------------------------------------------- | -------------------------------------- |
| **本番 URL**       | **https://kido-phi.vercel.app**                             | Vercel 自動デプロイ                    |
| 開発サーバ         | http://localhost:3000                                       | `npm run dev`                          |
| Supabase Dashboard | https://supabase.com/dashboard/project/eqkaaohdbqefuszxwqzr | スキーマ: `kido`                       |
| Vercel Dashboard   | https://vercel.com/shougihajime-3368s-projects/kido         | デプロイ・環境変数管理                 |
| GitHub repo        | https://github.com/shougihajime-eng/kido                    | push で自動デプロイ                    |

---

## 技術構成

- **フロント**: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **UI**: shadcn/ui（必要時に追加） + lucide-react
- **アニメーション**: Framer Motion + canvas-confetti
- **グラフ**: Recharts
- **DB**: 共有 Supabase（`https://eqkaaohdbqefuszxwqzr.supabase.co`）の **`kido` スキーマ**
- **Auth**: Supabase Auth（メール+パスワード）。3ロール：student / parent / teacher
- **AI**: Anthropic Claude API（Phase G で導入）
- **デプロイ**: Vercel（GitHub main 自動デプロイ）
- **PWA**: manifest（標準）+ Service Worker（Serwist は Phase G で追加予定）

### 主要ライブラリ

| 用途     | ライブラリ                               |
| -------- | ---------------------------------------- |
| 認証SSR  | `@supabase/ssr`, `@supabase/supabase-js` |
| アニメ   | `framer-motion`, `canvas-confetti`       |
| グラフ   | `recharts`                               |
| アイコン | `lucide-react`                           |
| PWA      | `@serwist/next`, `serwist`               |

---

## ディレクトリ構成

```
app/                        # Next.js App Router
  (auth)/                   # ログイン・サインアップ（未ログインで可）
  (student)/                # 生徒用ページ（要ログイン）
  (adult)/                  # 親・先生用（要ログイン + relationships 必須）
  api/                      # API ルート（service_role 操作・Cron 等）
  manifest.ts               # PWA マニフェスト
  icon.tsx / apple-icon.tsx # 動的アイコン生成
  globals.css               # Tailwind テーマ定義
components/                 # 共通コンポーネント
lib/
  supabase/
    client.ts               # browser
    server.ts               # server component
    admin.ts                # service_role（サーバー専用）
    middleware.ts           # SSR セッション更新
    types.ts                # Database 型
middleware.ts               # 認証ガード
supabase/
  migrations/
    0001_init.sql           # スキーマ + テーブル + RLS
    0002_seed_presets.sql   # 8カテゴリ + 初期バッジ
    0003_auth_trigger.sql   # auth.users → kido.profiles 自動連携
```

---

## 検証コマンド

```powershell
# 開発サーバ
npm run dev
# → http://localhost:3000

# 型チェック
npx tsc --noEmit

# Lint
npm run lint

# プロダクションビルド確認
npm run build

# Supabase マイグレーション適用（共有プロジェクトへ）
$env:SUPABASE_ACCESS_TOKEN="sbp_xxx"  # CLAUDE.md (~/.claude/) 参照
npx supabase link --project-ref eqkaaohdbqefuszxwqzr
npx supabase db push
```

---

## データモデル（要点）

詳細は `supabase/migrations/0001_init.sql` を見る。主要テーブル：

| テーブル                 | 用途                                                          |
| ------------------------ | ------------------------------------------------------------- |
| `profiles`               | ユーザー情報（auth.users 1:1）。role = student/parent/teacher |
| `relationships`          | 生徒 ↔ 親・先生 の紐づけ                                      |
| `invite_codes`           | 紐づけ用の使い捨て招待コード                                  |
| `categories`             | プリセット 8 種 + ユーザーカスタム                            |
| `training_records`       | 練習記録（メイン）                                            |
| `favorites`              | ワンタップ用お気に入り組み合わせ                              |
| `goals`                  | 週間/月間の目標                                               |
| `comments`               | 記録への親・先生・AI のコメント                               |
| `diary_entries`          | 悩み相談（visibility で公開範囲を制御）                       |
| `rating_history`         | 棋力推移（手動入力）                                          |
| `follows`                | 仲間フィード用                                                |
| `badges` / `user_badges` | バッジ・実績                                                  |
| `ai_comments`            | AI 生成コメント履歴                                           |

### RLS 方針

- 生徒は自分のレコードのみ読み書き可
- 親・先生は `relationships` で紐づいた生徒の記録を **読み取り専用**
- 紐づけは生徒が発行した `invite_codes` を親・先生が引き換える形（サーバー処理）
- 悩み相談 (`diary_entries`) は `visibility` カラムで公開範囲を厳格にコントロール

---

## はじめさんに依頼する作業（Claude では実行不可）

1. **Supabase Dashboard でスキーマ公開設定**
   - https://supabase.com/dashboard/project/eqkaaohdbqefuszxwqzr/settings/api
   - 「Exposed schemas」に `kido` を追加して保存（カンマ区切りで既存に追記）
2. **service_role キーの取得**
   - 同じ画面 → Project API Keys → service_role の値をコピー
   - `.env.local` の `SUPABASE_SERVICE_ROLE_KEY` に貼り付け
3. **Anthropic API キー**（Phase G で必要、後でOK）
   - https://console.anthropic.com/ で発行
4. **Vercel ダッシュボード**（Phase A 終盤）
   - GitHub repo `kido` を Vercel に連携
   - 環境変数 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` を登録

---

## 用語のかんたん説明（はじめさん向け）

| 用語          | わかりやすい説明                                    |
| ------------- | --------------------------------------------------- |
| PWA           | ホーム画面に追加してアプリのように使える Web ページ |
| App Router    | Next.js の「ページの仕組み」                        |
| スキーマ      | 共有データベースの中の「フォルダ」                  |
| RLS           | 他人のデータが見えないようにする鍵の仕組み          |
| Framer Motion | アニメーションを作るライブラリ                      |
| Recharts      | グラフを描くライブラリ                              |
| Vercel Cron   | 「毎日朝7時に自動で何かやる」仕組み                 |

---

## ライセンス・規約

- ユーザーの練習記録・悩み相談は本人と紐づいた親・先生のみアクセス可能
- service_role キーは絶対にコミットしない（.gitignore 済）
- 共有 Supabase の他スキーマ（shogi_hajime_ai, shogi_jikanwari, hajime_shogi）には触れない
