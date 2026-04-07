# C5med Beauty 予約システム — 初期セットアップガイド

このドキュメントでは、C5med Beauty 予約システムをゼロからデプロイ・運用開始するまでの全手順を説明します。

---

## 前提条件

- **Node.js** 20 以上
- **Bun** インストール済み (`curl -fsSL https://bun.sh/install | bash`)
- **Vercel CLI** インストール済み (`bun add -g vercel`)
- Google アカウント（カレンダー管理用）
- Vercel アカウント（https://vercel.com）

依存パッケージのインストール:

```bash
cd /Users/rikutanaka/RestaurantAILab/c5med-booking
bun install
```

---

## 1. Vercel プロジェクト作成 & デプロイ

### 1-1. Vercel にログイン

```bash
vercel login
```

ブラウザが開くので、Vercel アカウントで認証します。

### 1-2. プロジェクトをリンク

```bash
cd /Users/rikutanaka/RestaurantAILab/c5med-booking
vercel link
```

- **Set up and deploy?** → `Y`
- **Which scope?** → 自分のアカウントを選択
- **Link to existing project?** → `N`（新規作成）
- **Project name?** → `c5med-booking`
- **Directory?** → `./`（そのまま Enter）

### 1-3. GitHub リポジトリ連携（推奨）

GitHub にリポジトリを作成し、push 時に自動デプロイされるようにします。

```bash
# GitHub リポジトリ作成（gh CLI がある場合）
gh repo create RestaurantAILab/c5med-booking --private --source=. --push

# または手動で GitHub にリポジトリを作成後:
git remote add origin git@github.com:RestaurantAILab/c5med-booking.git
git push -u origin main
```

Vercel ダッシュボード（https://vercel.com/dashboard）でプロジェクトを開き、
**Settings → Git** から GitHub リポジトリを接続します。

### 1-4. 手動デプロイ（GitHub 連携なしの場合）

```bash
vercel deploy          # プレビューデプロイ
vercel deploy --prod   # 本番デプロイ
```

### 1-5. カスタムドメイン設定

1. Vercel ダッシュボード → プロジェクト → **Settings → Domains**
2. `book.c5med.jp` を入力して **Add**
3. 表示される DNS レコードを、c5med.jp のドメイン管理画面で設定:
   - **CNAME レコード**: `book` → `cname.vercel-dns.com`
   - または **A レコード**: `76.76.21.21`
4. SSL 証明書は Vercel が自動で発行します（数分待機）

---

## 2. Neon PostgreSQL データベースのセットアップ

### 2-1. Vercel Storage で Neon を追加

1. Vercel ダッシュボード → プロジェクト → **Storage** タブ
2. **Create Database** → **Neon Serverless Postgres** を選択
3. データベース名: `c5med-booking-db`
4. リージョン: **Tokyo (ap-northeast-1)** を推奨
5. **Create** をクリック

作成完了後、`DATABASE_URL` が Vercel の環境変数に自動設定されます。

### 2-2. ローカル開発用の環境変数を取得

```bash
# Vercel から環境変数をプル（.env.local が生成される）
vercel env pull .env.local
```

または、Vercel ダッシュボード → **Storage** → 作成したデータベース → **`.env.local` タブ** から接続文字列をコピーし、手動で `.env.local` に記載:

```
DATABASE_URL=postgresql://neondb_owner:xxxx@ep-xxx.ap-northeast-1.aws.neon.tech/neondb?sslmode=require
```

### 2-3. スキーマを適用

```bash
bunx drizzle-kit push
```

`stores`, `courses`, `store_courses`, `bookings` の 4 テーブルが作成されます。

### 2-4. シードデータを投入

```bash
bun run src/lib/db/seed.ts
```

7 店舗 × 8 コースのデータが挿入されます。

投入される店舗:
| ID | 店舗名 |
|----|--------|
| shin-kobe | 新神戸店 |
| sapporo-nishi11 | 札幌西11丁目店 |
| sapporo-kita2 | 札幌北2条店 |
| nagoya-hilton | 名古屋ヒルトン店 |
| kyoto | 京都店 |
| shimbashi | 新橋店 |
| fukuoka-c5clinic | 福岡C5クリニック店 |

> **注意**: シードデータの `calendarId` はダミー値です。後述の手順でカレンダー作成後に更新が必要です。

---

## 3. Google Cloud Console でのサービスアカウント設定

### 3-1. プロジェクト作成

1. https://console.cloud.google.com にアクセス
2. 上部のプロジェクトセレクタ → **新しいプロジェクト**
3. プロジェクト名: `c5med-booking` → **作成**

### 3-2. Google Calendar API を有効化

1. 左メニュー **API とサービス** → **ライブラリ**
2. 検索ボックスに `Google Calendar API` と入力
3. **Google Calendar API** をクリック → **有効にする**

### 3-3. サービスアカウント作成

1. 左メニュー **API とサービス** → **認証情報**
2. 上部の **+ 認証情報を作成** → **サービスアカウント**
3. 設定:
   - サービスアカウント名: `c5med-booking-calendar`
   - サービスアカウント ID: `c5med-booking-calendar`（自動入力）
   - 説明: `C5med予約システム用カレンダー連携`
4. **作成して続行** → ロール付与はスキップ → **完了**

### 3-4. サービスアカウントキー（JSON）を取得

1. 作成したサービスアカウント `c5med-booking-calendar@c5med-booking.iam.gserviceaccount.com` をクリック
2. **鍵** タブ → **鍵を追加** → **新しい鍵を作成**
3. キーのタイプ: **JSON** → **作成**
4. JSON ファイルが自動ダウンロードされる

### 3-5. 環境変数に設定

ダウンロードした JSON の内容を **1 行に整形して** 環境変数に設定します。

```bash
# JSON ファイルを1行に変換
cat ~/Downloads/c5med-booking-xxxx.json | jq -c . | pbcopy
```

`.env.local` に追記:

```
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"c5med-booking","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"c5med-booking-calendar@c5med-booking.iam.gserviceaccount.com",...}
```

> **重要**: JSON キーファイルは機密情報です。Git にコミットしないでください。`.gitignore` に `*.json` キーファイルが含まれていることを確認してください。

---

## 4. Google Calendar の店舗カレンダー作成

**個人カレンダーではなく、店舗専用のカレンダーを作成します。**

### 4-1. 7 店舗分のカレンダーを作成

1. https://calendar.google.com にアクセス
2. 左サイドバー **他のカレンダー** の **＋** → **新しいカレンダーを作成**
3. 以下の 7 つを順に作成:

| カレンダー名 | 対応する store ID |
|-------------|-------------------|
| C5med 新神戸店 | shin-kobe |
| C5med 札幌西11丁目店 | sapporo-nishi11 |
| C5med 札幌北2条店 | sapporo-kita2 |
| C5med 名古屋ヒルトン店 | nagoya-hilton |
| C5med 京都店 | kyoto |
| C5med 新橋店 | shimbashi |
| C5med 福岡C5クリニック店 | fukuoka-c5clinic |

### 4-2. サービスアカウントにカレンダーを共有

**各カレンダーに対して以下を実行:**

1. カレンダーの **⋮（三点メニュー）** → **設定と共有**
2. **特定のユーザーまたはグループと共有する** セクション
3. **ユーザーやグループを追加** をクリック
4. サービスアカウントのメールアドレスを入力:
   ```
   c5med-booking-calendar@c5med-booking.iam.gserviceaccount.com
   ```
5. 権限: **予定の変更** を選択
6. **送信** をクリック

### 4-3. カレンダー ID を取得

1. 各カレンダーの **設定と共有** を開く
2. **カレンダーの統合** セクションの **カレンダー ID** をコピー
   - 形式: `xxxxxxxxx@group.calendar.google.com`

### 4-4. データベースの stores テーブルを更新

取得したカレンダー ID を stores テーブルに設定します。
SQL クライアントまたは Neon ダッシュボードの SQL Editor で実行:

```sql
UPDATE stores SET calendar_id = 'xxxx1@group.calendar.google.com' WHERE id = 'shin-kobe';
UPDATE stores SET calendar_id = 'xxxx2@group.calendar.google.com' WHERE id = 'sapporo-nishi11';
UPDATE stores SET calendar_id = 'xxxx3@group.calendar.google.com' WHERE id = 'sapporo-kita2';
UPDATE stores SET calendar_id = 'xxxx4@group.calendar.google.com' WHERE id = 'nagoya-hilton';
UPDATE stores SET calendar_id = 'xxxx5@group.calendar.google.com' WHERE id = 'kyoto';
UPDATE stores SET calendar_id = 'xxxx6@group.calendar.google.com' WHERE id = 'shimbashi';
UPDATE stores SET calendar_id = 'xxxx7@group.calendar.google.com' WHERE id = 'fukuoka-c5clinic';
```

> **Neon SQL Editor**: Vercel ダッシュボード → Storage → データベース → **SQL Editor** タブ

---

## 5. Resend メール設定

### 5-1. アカウント作成 & API キー取得

1. https://resend.com にアクセスしてアカウント作成
2. ダッシュボード左メニュー **API Keys**
3. **Create API Key** をクリック
   - Name: `c5med-booking`
   - Permission: **Full access**
4. 表示された API キー（`re_` で始まる文字列）をコピー

### 5-2. 環境変数に設定

`.env.local` に追記:

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
```

### 5-3. ドメイン認証（本番運用時）

テスト段階では `onboarding@resend.dev` から送信可能です。
本番運用時はドメイン認証を行います:

1. Resend ダッシュボード → **Domains** → **Add Domain**
2. `c5med.jp` を入力
3. 表示される DNS レコード（MX, TXT）を c5med.jp のドメイン管理画面で設定
4. Resend 側で **Verify** をクリック

認証完了後、`noreply@c5med.jp` などの差出人アドレスが使用可能になります。

---

## 6. 環境変数の設定まとめ

### ローカル開発用 (`.env.local`)

```bash
# データベース（Neon PostgreSQL）
DATABASE_URL=postgresql://neondb_owner:xxxx@ep-xxx.ap-northeast-1.aws.neon.tech/neondb?sslmode=require

# Google Calendar サービスアカウント（JSON を1行に整形）
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"c5med-booking",...}

# Resend メール送信
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
```

### Vercel 環境変数

Vercel ダッシュボード → プロジェクト → **Settings** → **Environment Variables**

| 変数名 | 値 | 備考 |
|--------|------|------|
| `DATABASE_URL` | （自動設定済み） | Neon Storage 連携で自動 |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | JSON 文字列（1行） | 手動設定 |
| `RESEND_API_KEY` | `re_...` | 手動設定 |

Vercel CLI からも設定可能:

```bash
# 対話形式で設定（値の入力を求められる）
vercel env add GOOGLE_SERVICE_ACCOUNT_KEY
vercel env add RESEND_API_KEY
```

---

## 7. 動作確認

### 7-1. ローカル開発サーバー起動

```bash
bun dev
```

### 7-2. DB 接続テスト

ブラウザで以下にアクセス:

```
http://localhost:3000/stores/shin-kobe
```

- コース一覧が表示されれば DB 接続 OK

### 7-3. カレンダー接続テスト

- 日付を選択して空き時間スロットが表示されるか確認
- 表示されない場合:
  - `GOOGLE_SERVICE_ACCOUNT_KEY` が正しいか確認
  - カレンダーがサービスアカウントに共有されているか確認
  - stores テーブルの `calendar_id` が正しいか確認

### 7-4. 予約テスト

1. コースを選択 → 日時を選択 → 予約情報を入力 → 送信
2. 確認事項:
   - bookings テーブルにレコードが作成されるか
   - Google Calendar にイベントが作成されるか
   - 確認メールが届くか（Resend のダッシュボードでも送信ログを確認可能）

### 7-5. 本番デプロイ確認

```bash
vercel deploy --prod
```

本番 URL（または `book.c5med.jp`）で同様の動作確認を行います。

---

## トラブルシューティング

### DB 接続エラー

```
Error: connection refused / SSL required
```

→ `DATABASE_URL` に `?sslmode=require` が含まれているか確認

### Google Calendar API エラー

```
Error: insufficient authentication scopes
```

→ サービスアカウントキーの JSON が正しく1行に整形されているか確認
→ Calendar API が有効化されているか確認

### メール送信エラー

```
Error: Missing API key
```

→ `RESEND_API_KEY` が `.env.local` に設定されているか確認

### Drizzle push エラー

```
Error: relation already exists
```

→ すでにテーブルが存在する場合は正常。変更がなければスキップされます。

---

## 全体フロー図

```
ユーザー → book.c5med.jp → Vercel (Next.js)
                              ├── Neon PostgreSQL（店舗・コース・予約データ）
                              ├── Google Calendar API（空き時間確認・イベント作成）
                              └── Resend（確認メール送信）
```
