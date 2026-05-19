@AGENTS.md

# 棋道 (kido) — プロジェクト概要

将棋のプロ棋士・女流棋士を志す生徒（奨励会員・女流棋士志望）が「毎日開きたくなる」トレーニング記録アプリ。
**Strava の将棋版、Duolingo の将棋版** を目指す。

---

## 進捗（いまここ）

- ✅ **直近で済んだこと**（2026-05-20 夜）: **プライベートモードを追加**
  - 競争が苦手な子向けの「マイペース」モード
  - 生徒は /profile/edit で ON/OFF（デフォルトOFF）／親・先生は /family/[studentId] からも切替可
  - /follow で他のプライベート生徒は「ひみつの仲間」表示・★対象外
  - 自分がプライベートなら hero card の「◯位/◯人中」と各行の順位バッジを非表示
  - 時間は見える＆順位の並びには入る（がんばった分は仲間に伝わる）
  - 親・先生の見守り画面では今まで通り本名と時間が見える
  - DB: `supabase/migrations/0010_private_mode.sql` 適用済み（private_mode 列 + set_student_private_mode RPC）
- ✅ **その前**（2026-05-20）: **「名言の間」大幅増量＋テーマタグ追加**
  - 名言データを **389 句** に増量（棋士の言葉 130 ＋ 将棋格言 40 ＋ 全力系 219）
  - **テーマタグ 8 種** を導入（しんどい時／スランプ／大事な対局の前／負けた時／集中できない時／自信がない時／続ける力がほしい時／挑戦する勇気がほしい時）
  - `/meigen` 一覧ページに「**今のキモチで選ぶ**」テーマフィルタを追加（出典フィルタと併用可）
  - 各名言カードに該当テーマのタグを表示（金バッジ）
- ✅ **その前**（2026-05-20）: **「名言の間」初版（筆文字・無限ループ更新）**
  - ダッシュボード最上段に常時表示の名言カード（筆文字・和紙風背景・朱印付き）
  - 「次の名言」ボタンで無限に切替（直前と同じものを引かない）
  - 一覧ページ `/meigen`（出典フィルタ「すべて／棋士／格言／全力」付き）
  - 下メニュー＋PCサイドバーに「名言」タブ追加（生徒・親・先生 共通）
  - フォント: Yuji Mai（毛筆）＋Shippori Mincho（明朝）を `next/font/google` で追加
  - iPhone・PC 両対応（タップ領域 48px 以上・フォントサイズ レスポンシブ）
- ✅ **その前**（2026-05-20）: **コメント大改修＋自己メモ＋日記＋親・先生グラフ**
  - 生徒・親・先生 みんなで会話できるコメント（生徒の書き込みを開放、双方向化）
  - 自分のコメントは **いつでも編集** 可能（編集済みマーク表示）
  - **絵文字リアクション**: 👍❤️🔥🎉👏🙏 をワンタッチで（comment_reactions テーブル）
  - **自分だけのメモ**: 練習記録ごとに self_memo を追加（金色枠で「自分しか見えない」表示）
  - **日記ページ** /diary 新規: visibility='self' で完全プライベートな日記
  - **親・先生グラフ刷新**: 4枚サマリー＋週間棒＋カテゴリ円＋30日エリア＋時間帯＋26週ヒートマップ
  - 共通コンポーネント components/comments/CommentThread で 生徒/親/先生 全画面共有
  - DB: `supabase/migrations/0009_comments_v2_and_self_memo.sql` 適用済み
- ✅ **その前**（2026-05-19 夜）: **トップページ（ランディング）をスポグ風に全面リニューアル**
  - 参考: https://spog.co.jp/ + はじめさん指定のスクリーンショット
  - 構成: ヒーロー → 3つの価値 → 生徒さん用ページサンプル（スマホ4枚） → 親・先生用ページサンプル（金色帯 + スマホ3枚） → クロージングCTA → フッター
  - スマホモックアップは CSS のみで「擬似スクショ」を描画（記録ウィザード / ダッシュボード / ヒートマップ / ランキング / 生徒一覧 / コメント / 目標）
  - 後日、本物のスクショ画像に差し替え可能な構造
- ✅ **その前**（2026-05-19 夜）: **段級（だんきゅう）＋「全員見守り」先生**
  - サインアップで **生徒だけ・必須** の段級カテゴリ＋段級テキスト入力（奨励会員／女流棋士／研修会員／アマチュア／その他／まだ無し ＋「三段」「2級」「B1」など）
  - `/profile/edit` で あとから なまえ・段級を編集可能
  - ランキング（仲間）と見守り画面で段級を表示（例：「奨励会 三段」「女流 1級」）
  - はじめさん（display_name='はじめ'）は **「全員見守り」先生** に昇格、招待なしで全生徒の記録を見られる
  - 他の親・先生は従来どおり 招待コード制（変更なし）
  - DB: `supabase/migrations/0008_level_and_super_teacher.sql` 追加
- ✅ **その前**（2026-05-19 夕方）: **iPhone/iPad での操作性改善**
  - 「1回めのタップで反応せず2回めで動く」問題を解消（whileHoverの除去 + hover-lift化）
  - iOS のタップ青フラッシュを消す（`-webkit-tap-highlight-color: transparent`）
  - タップ即反応（`touch-action: manipulation`）で 300ms 遅延を解消
  - 主要ボタンのタップ領域を 44px 以上に：分入力 +/- (48px)、戦型タグ (40px)、戻る (56px)、下ナビ (60px)
- ✅ **その前**（2026-05-19）:
  0. **生活カテゴリーを追加（学校・睡眠・食事・遊び・運動・スマホ）**
     - 「将棋集中アプリ」の軸はそのままに、1日の使い方マップを記録できる
     - 記録ウィザードで「将棋／生活」のグループ見出し付きで選べる
     - 連続日数🔥・目標（全体）・バッジは **将棋カテゴリーだけ** で判定（生活だけで稼げない仕組み）
     - 生活カテゴリーはくすみカラー（cat-life-*）で将棋と視覚的に区別
     - DB: 共有 Supabase に migration 0006_life_categories.sql 適用済み（categories.kind 列 + 生活6カテゴリ）
  1. **デザイン全面リフレッシュ（明るい和モダン）+ PC左サイドバー**
     - ダーク基調 → クリーム + 藍 + 金 + 桜のあかるい和モダン配色
     - 文字サイズを大きめに（読みやすさ最優先、base 18px）
     - PC（横長画面）に左固定サイドバー追加、スマホは従来のボトムナビ維持
     - 数字フォントを Inter に変更（斜線 0 をやめる）
  2. **「仲間・ライバル」公開ランキング機能**
     - 招待なしで全員の今週時間が見える（migration 0007）
     - rivals テーブルで★ライバルマーク（自分専用）
     - /follow ページ：ヒーロー + ランキング + みんな/ライバルタブ
     - 30秒ごとに自動更新（revalidate=30s）
- ✅ **これまでに済んだこと**（〜2026-05-19）: **Phase A・B・C・D・E・F 完了！**
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
- 🔜 **次の一歩（候補）**: 1) プライベートモードを本番で実機確認（生徒側でON→/followで自分の順位が消えるか／別アカウントから見て「ひみつの仲間」表示になるか）、2) AIコメント（Phase G）の実装、3) PWA Service Worker（Serwist）の本格導入

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
