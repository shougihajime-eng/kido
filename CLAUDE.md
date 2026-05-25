@AGENTS.md

# 棋道 (kido) — プロジェクト概要

将棋のプロ棋士・女流棋士を志す生徒（奨励会員・女流棋士志望）が「毎日開きたくなる」トレーニング記録アプリ。
**Strava の将棋版、Duolingo の将棋版** を目指す。

---

## 進捗（いまここ）

- ✅ **直近で済んだこと**（2026-05-25・詰将棋を「指で動かして解ける」ように＋出どころ表示）:
  - **インタラクティブな解答モードを追加**（`/tsume` ＝ `components/tsume/TsumeSolver.tsx`）
    - こまをタップ → 行き先をタップで指す。正解なら相手が自動で受けて1手進む、不正解なら「もう一回！」
    - 詰みまで解けたら「正解！詰み！」＋紙吹雪（canvas-confetti）。ヒント／答えを見る／もう一度／次の問題ボタン
    - 指で動かせる盤 `components/tsume/SolveBoard.tsx`（タップ操作・持ち駒タップで打てる）
    - 照合用に各問題へ `movesUsi`（正解手のUSI）と `frames`（1手ごとの盤面SFEN）を追加（`lib/tsume.ts`）
  - **「出どころ」を各問題に表示**（はじめさんの要望）。いまは全問「コンピューター作成・検証済み」。
    将来 古典を入れたら「将棋図巧 第○番（伊藤看寿）」のように作者・出典を出す（`source`/`composer`）
  - ダッシュボードの小カードは答えを隠し「指で解いてみる」ボタンで `/tsume` へ誘導
  - 型チェック・lint・本番ビルドすべて通過（`/tsume` がルートに出ることを確認）
  - ✅ **本番反映：GitHub に push 済**（2026-05-25・Vercel が自動で公開／kido-phi.vercel.app）
- ✅ **その前**（2026-05-25・アプリで「英語の不具合画面」が出ないように日本語の画面を新設）:
  - はじめさんから「アプリを開くとたまに英語みたいなのが出て不安」との相談。原因は **「うまく開けなかったとき用の日本語画面」が無く、Next.js のデフォルト英語画面がそのまま出ていた**こと
  - **日本語の代替画面を3つ新設**（クリーム地・藍色・🌸 で棋道らしい見た目に統一）:
    - `app/error.tsx` — ページで一瞬の不具合が起きたとき。「もう一度ひらく」ボタン（unstable_retry）＋「ホームにもどる」
    - `app/global-error.tsx` — 土台ごと開けなかったときの最後の砦。globals.css が効かない可能性に備え色・文字を inline style で内蔵。html/body 自前
    - `app/not-found.tsx` — 404（ページが見つからない）。「ホームにもどる」ボタン
  - 型チェック・lint・本番ビルドすべて通過済み（`/_not-found` がルートに追加されたのを確認）
  - ✅ **本番反映：GitHub に push 済**（2026-05-25・Vercel が自動で公開／kido-phi.vercel.app）
- ✅ **その前**（2026-05-25・詰将棋「今日の名作」コーナーを新設）:
  - **毎日1問の詰将棋コーナーを追加**（下メニューに「詰将棋」タブ／ダッシュボードに「今日の一問」カード）
    - 将棋盤を表示（SFEN という局面の書き方から盤の絵を組み立て）、「答えを見る」で詰み上がりと手順が出る
    - 「次の問題」で切り替え。日付で毎日の一問が決まる（名言の間と同じ仕組み）
    - ページ: `app/tsume/`、ビューア: `components/tsume/TsumeViewer.tsx`、盤: `components/tsume/ShogiBoard.tsx`、データ: `lib/tsume.ts`
  - **問題が壊れていないかを機械で確認するツールを用意**（`scripts/tsume_solver.py`）
    - 「開始局面で玉に王手がかかっていない」「本当に詰む」「何手詰か」「答えが1通りか」を判定（python-shogi 使用）
    - 登録する問題はすべてこれで検証してから入れる方針（記憶頼みで並べない）
  - **問題をコンピューターで自動生成 → 全部検証して9問登録**（`scripts/generate_tsume.py`）
    - 3手詰×4・5手詰×5。すべて「開始王手なし・指定手数で詰む・答えが一通り（余詰なし）」を確認済み
    - 著作権の心配ゼロ（コンピューター生成）。難度ラベルは 3手=やさしい / 5手=ふつう
    - ⚠️ ネットの有名詰将棋（shogi-problem.org・将棋タウン等）は作家に著作権があり**無断複製不可**
    - このランダム生成方式は3〜5手は得意だが、7手以上の長手数は出にくい（要・別方式）
  - 🔜 本物の「名作」（将棋図巧・将棋無双など著作権切れの古典）は別途、正しい棋譜データから検証して追加予定
- ✅ **その前**（2026-05-22・記録ない日にもコメントを書ける + ログイン直後の不具合修正）:
  - **日コメント機能を追加** — カレンダー（/calendar・/family/[studentId]）で日付をタップすると、記録がある日もない日も「この日への声かけ」コメントスレッドが表示される。本人・親・先生・スーパー先生（はじめさん）の全員が書き込み可。自分のコメントだけ編集・削除可。
    - DB: `supabase/migrations/0016_day_comments.sql` 適用済み（`kido.day_comments` テーブル + RLS）
    - サーバーアクション: `app/_actions/day-comments.ts`
    - UIコンポーネント: `components/comments/DayCommentThread.tsx`
    - カレンダーヒートマップ（生徒側・親先生側）の選択日カードに自動表示
  - **iPhone Safari でログイン直後にボタン・ナビが効かなかった不具合を応急処置** — middleware が `/sw.js` も認証ガードしてしまい 307 リダイレクトを返していたため、Service Worker 登録が中途半端になっていた。matcher を更新して `/sw.js`・`.js`・`.json`・`.map`・フォント類を除外
- ✅ **その前**（2026-05-20 夜・優しいバッジ 10個 ＋ あだ名のトゲ抜き）:
  - **「やってない子が嫌な気持ちにならない」バッジ 10個 を追加**（DB migration 0015 適用済み）
    - 🌱 最初の一歩系: **はじめの一歩**（1分でも記録）／**ようこそ**（サインアップ完了）／**気持ちを書いた**（自分メモ初投稿）
    - 🌸 おかえり系: **おかえり**（1週間休んで戻った）／**また会えたね**（2週間以上空けて戻った）／**マイペース**（30日中8日以上記録）
    - ☀️ 気持ち系: **朝の人**（5〜9時に記録）／**夜の人**（21時以降に記録）／**ありがとう**（親・先生と紐づき）／**自分新記録**（先週より今週がんばった）
  - **既存あだ名から強い言葉（廃人／修羅／鬼／覇者）を外して柔らかく**
    - 「将棋廃人」→「将棋大好きさん」、「修羅の道」→「千時間の旅人」、「詰将棋鬼」→「詰将棋の達人」、「一ヶ月の鬼」→「ひと月の人」、「百日の覇者」→「百日続けた人」
  - **評価ロジック拡張**: lib/badges/evaluate.ts に 8種の新 criteria を実装（first_record / welcome / first_self_memo / comeback_after_days / monthly_active / time_of_day / has_relationship / week_over_week）
  - **BadgeShelf アイコン増強**: sun, moon, heart, sprout, sparkles, users, trending-up を追加してバッジに表情を付与
- ✅ **その前**（2026-05-20 夜・笑いと親しみやすさ 3点セット）:
  - **🐣 マスコット「ふっち」を作成** — 歩兵の駒に小さい目をつけたSVGキャラ（`components/mascot/Fuchi.tsx`）。normal/cheer/sleepy/worry の4表情。ダッシュボードで「今日まだ記録なし」の時だけそっと吹き出しで語りかける（連続日数によってセリフが変わる）
  - **📜 名言に「クスッと枠」30句を追加** — 米長邦雄「兄たちは頭が悪いから東大に行った」、加藤一二三「相手の駒を勝手に動かさないでください」、升田幸三「名人に香車を引いて勝つ」など、有名なクスッとエピソード＋将棋好きあるある。テーマタグ `humor`（ちょっと笑いたい時）を新設し /meigen 一覧で選べる
  - **🏆 バッジに「あだ名」を追加** — `lib/badge-nicknames.ts` で公式名と別にあだ名を併記。streak_7→「毎日の人」、streak_100→「百日の覇者」、total_100h→「将棋廃人（褒め言葉）」、tsume_50h→「詰将棋鬼」など、本気度を損なわず親しみを足す
- ✅ **その前**（2026-05-20 夜・予定通知 3段階）:
  - **A. ダッシュボードに「今日／明日」警告バナー**: countdowns で残り0〜1日のものがある時、赤色の大きい警告を最上段に表示
  - **B. カレンダー（/calendar）に予定マーカー**: 26週ヒートマップに絵文字＋赤枠で予定を重ねて表示、未来日も含めて grid 拡張、日付タップで予定詳細＋追加リンク
  - **C. 本物のWebプッシュ通知**: 公開鍵方式（VAPID）でブラウザ通知を実装
    - public/sw.js: Service Worker（push 受信 + クリックで該当URLを開く）
    - /api/push/subscribe, /api/push/unsubscribe: 購読管理
    - components/PushNotificationToggle.tsx: /profile に通知ON/OFFスイッチ
    - /api/cron/push-daily: Vercel Cron で毎朝JST 7時に「今日／明日」の予定を全購読者へ通知
    - vercel.json: cron 設定追加（UTC 22時 = JST 朝7時）
    - DB: `supabase/migrations/0014_push_subscriptions.sql` 適用済み
    - VAPID鍵は生成済み・.env.local に書込済み・**本番は Vercel に環境変数登録要（はじめさん作業）**
- ✅ **その前**（2026-05-20 夜・LINE で「下までスクロールできない」苦情を解消）:
  - **生徒さんから「招待コードを送りたいけど一番下までスクロールできない」と連絡があった**
  - 原因: iPhone の下メニュー（60px ＋ ホームインジケータの 34px ＝ 約94px）に対して、本文の余白が pb-24（96px）でカツカツ。/code ページの最後の「LINEで送る」ボタンや「コードを削除」が押せなかった
  - 修正: 新ユーティリティ `pb-bottom-nav` を追加し、`calc(60px + env(safe-area-inset-bottom) + 1.5rem)` に拡張。確実に届くように
  - 適用先: 生徒レイアウト / 親・先生レイアウト の両方
  - ついでに新規追加された /timer ページの lint エラー（コンポーネント再生成バグ）と未使用 import を整理
- ✅ **その前**（2026-05-20 夜・Studyplus風 3機能を追加）:
  - **📅 カウントダウン（/countdowns）**: 奨励会試験・大会までの残り日数。7日以内は赤・30日以内は金。ダッシュボード上部に直近2件を表示。migration 0012 適用済み
  - **⏱ タイマー＆ストップウォッチ（/timer）**: 0から経過時間を計測 or 「あと◯分」タイマー、localStorageで離脱しても継続、停止時に自動記録。Studyplusのタイマー機能を将棋向けに転用
  - **📚 棋書本棚（/books）**: 使っている棋書を絵文字＋タイトルで登録、読書中/読了/休憩中で分類、記録時に「使った本」を紐づけて累積時間を表示。migration 0013 適用済み
  - 3機能とも生徒ダッシュボードからワンタップでアクセス可
- ✅ **その前**（2026-05-20 夜・生徒運用前の品質磨き）:
  - **lint エラーをゼロに**: `react-hooks/static-components` バグ修正（記録カードの状態がリセットされる可能性を解消）、`any` 型を排除（13個 → 0個）、未使用変数を削除
  - **Supabase の型定義を実スキーマと一致させた**: `profiles.level_kind / is_super_teacher / private_mode`、`training_records.self_memo`、`comments.updated_at` を types.ts に追記
  - **ダッシュボード末尾に内部メアド（uuid@kido.local）を晒していたのを修正**: 「ようこそ ◯◯ さん」に置き換え
  - **記録カードに日付ラベル**: 「新しいコメントが届いた記録」一覧で「昨日」「3日前」「5月15日(金)」など、いつの記録か一目でわかるように
  - 親・先生ホームの「コメント機能は今後追加予定」という古い案内文を「みたよコメントを残せます」に更新
- ✅ **その前**（2026-05-20 夜）: **アマチュア対応＆段位/級位を分けた**
  - 段級カテゴリに「アマチュア（段位）」「アマチュア（級位）」を追加（旧 amateur は amateur_dan に自動寄せ）
  - サインアップ画面に「アマチュアの方も大歓迎」の説明を追加
  - 並び順を変更（アマチュアを上に）
  - ランディング(/)のキャッチコピーを「将棋プロ志望のため」→「将棋を本気で楽しむすべての人の研鑽ノート」に
  - 「3つの価値」の仲間欄に「競争が苦手な人はプライベートモードで」一言追加
  - DB: `supabase/migrations/0011_amateur_dan_kyu.sql` 適用済み
- ✅ **その前**（2026-05-20 夜）: **共有ボタン（シェア機能）を追加**
  - `components/ShareAppButton.tsx` 新規（Web Share API → スマホは標準共有メニュー／PCはクリップボードコピー）
  - トップページ（/）のクロージングCTA下、生徒ダッシュボード末尾、親・先生ホーム末尾の **3ヶ所** に設置
  - 共有メッセージ:「将棋の練習を毎日記録できる『棋道』、よかったら使ってみて！ 🌸 + URL」
  - 押すと「コピーしました！」/「共有しました！」のフィードバックが2.4秒表示
- ✅ **その前**（2026-05-20 夜）: **プライベートモードを追加**
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
- 🔜 **次の一歩（候補）**: 1) 詰将棋コーナーに本物の名作（古典・著作権切れ）を入れる＝信頼できる棋譜データの入手方法を決める、2) カウントダウン・タイマー・本棚を iPhone と PC で実機確認、3) AIコメント（Phase G）の実装

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
5. **Vercel に Web Push 通知の環境変数を登録**（2026-05-20 追加・通知機能のため）
   - https://vercel.com/shougihajime-3368s-projects/kido/settings/environment-variables
   - 以下3つを「Production / Preview / Development」全部にチェックして登録
     - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = `BI1DoNHPJsfyPdAbO_vEpBFfiw8KruBIOkqLKtzvpdUcHhv3YlXa-AzouTzVQ2rUMBQGzzcfQAH-u1XAo7Bmpgo`
     - `VAPID_PRIVATE_KEY` = `gwZoAWntu32mKd7Ch-PBfP-1WSxLh_hz4roterOetb4`
     - `VAPID_SUBJECT` = `mailto:shougi.hajime@gmail.com`
   - 登録したら一度デプロイをリトライ（Deployments → 最新の "..." → Redeploy）
   - これをやらないと「通知をONにする」を押しても本番では動きません
   - 登録後、iPhone は「ホーム画面に追加」してから棋道を開いて通知ONにする（iOS の制約）

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
