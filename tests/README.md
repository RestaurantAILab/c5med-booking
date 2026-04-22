# E2E Tests (Playwright)

本番環境 (https://c5med-booking-restaurant-ai-lab.vercel.app) に対して直接実行する Playwright E2E スイート。

> ⚠️ **警告** — このテスト群は本番DB (Neon) / 本番Google Calendar / 本番Vercel Blob に書き込みます。実行前に必ず下記のクリーンアップ動作を理解してください。

## 構成

```
tests/
├── .auth/            # storageState（.gitignore 済み、コミット禁止）
├── fixtures/         # アップロード用のダミー画像など
├── helpers/
│   ├── db.ts         # Neon DB ヘルパー（bookings / courses / holidays）
│   ├── calendar.ts   # Google Calendar ヘルパー（サービスアカウント）
│   └── test-data.ts  # E2E_TEST_ プレフィックス生成
├── setup/
│   └── admin-auth.setup.ts   # 管理画面の storageState を取得（headed）
├── user/             # 認証不要のユーザー側テスト
└── admin/            # storageState 必須の管理画面テスト
```

## 初期セットアップ

1. 依存インストール（プロジェクトルートで）

   ```bash
   bun install
   bunx playwright install chromium
   ```

2. `.env` に以下が揃っていることを確認:
   - `DATABASE_URL`  (Neon 接続URL — `helpers/db.ts` がこれを使う)
   - `GOOGLE_SERVICE_ACCOUNT_KEY`  (Calendar 検証用)

   ※ 予約テストは Calendar に書き込みを行うため、サービスアカウントに書き込み権限が必要。

3. **初回のみ** — 管理画面の storageState を取得（Google の手動ログインが必要）

   ```bash
   bun run test:e2e:setup-admin
   ```

   Chrome が立ち上がるので、許可メール (`restaurant.ai.lab@gmail.com`) でログインする。
   成功すると `tests/.auth/admin.json` が保存され、以後の `--project=admin` で再利用される。

   > cookie の期限切れや ADMIN_ALLOWED_EMAILS の変更時は再度このコマンドを流す。

## テスト実行

```bash
# 全テスト（storageState がなければ setup-admin が先に走る）
bun run test:e2e

# UI で対話実行（おすすめ）
bun run test:e2e:ui

# ユーザー側のみ
bun run test:e2e:user

# 管理画面のみ
bun run test:e2e:admin

# 未認証 /admin リダイレクト確認
bun run test:e2e:admin-unauth
```

`E2E_BASE_URL` を指定すると接続先を切り替えられる（例: ステージング）:

```bash
E2E_BASE_URL=https://c5med-booking-staging.vercel.app bun run test:e2e:user
```

## 本番への書き込みテストと破壊防止パターン

| テスト | 本番への書き込み | 破壊防止 |
|---|---|---|
| `user/booking-flow.spec.ts` | Neon `bookings` INSERT / Google Calendar event 作成 | `email` が `E2E_TEST_` プレフィックスのレコードを `afterEach` で全削除、Calendar event も ID 指定で削除 |
| `admin/course-management.spec.ts`（新規作成） | `courses` INSERT / Vercel Blob 画像アップロード | UI 削除ボタン（内部で Blob + DB を掃除）で片付け。失敗時のみ `afterEach` で DB 直削除 |
| `admin/course-management.spec.ts`（編集） | なし | 既存値をそのまま再保存する非破壊パターン |
| `admin/store-settings.spec.ts` | 例外休日の一時的な追加 | 1年後の任意日付を使用し、UI と DB 両方から必ず削除 |

### クリーンアップが失敗した場合

`afterEach` で DB / Calendar / Blob の削除に失敗するとテストは fail します。エラーメッセージに残っているリソース情報（booking id / event id / course id）を元に手動で削除してください。

- **DB bookings** — `bun run scripts/verify-calendar-booking.ts <storeId> 14` で残留を確認
- **Calendar events** — 同スクリプトで表示、または Google Calendar 上で `【予約】E2E_TEST_*` を検索
- **Vercel Blob** — Vercel ダッシュボード → Storage → Blob で `courses/` プレフィックスの `E2E_TEST_*` を確認

### verify-calendar-booking.ts の使い方

```bash
bun run scripts/verify-calendar-booking.ts sapporo-nishi11 14
```

前後 14 日のカレンダーイベントと DB bookings を突合し、孤児レコード（DB にあって Calendar にない / 逆）を表示する。

## 既知の制約・メモ

- `admin/store-settings.spec.ts` の「例外休日 往復」は DayPicker のクリック操作が flaky なため、一時的に DB 直挿入 → UI 上のタグ表示確認 → UI 削除ボタン経由で Server Action 保存、というハイブリッドにしている。
- 許可外メールのログイン拒否は手動テスト。`tests/admin/auth.spec.ts` の先頭コメントに手順を記載。
- 管理画面テストは Playwright workers = 1 で直列実行（設定の競合を避けるため）。

## カレンダーへの不正予約を残さないチェックリスト

テストセッション終了後、以下を確認すること:

- [ ] `bun run scripts/verify-calendar-booking.ts sapporo-nishi11 14` で `E2E_TEST_` イベントがゼロ
- [ ] 同スクリプトを `nagoya-hilton`, `shimbashi` でも実行
- [ ] Vercel Blob の `courses/` に `E2E_TEST_` 関連の画像が残っていない
- [ ] Neon の `courses` テーブルに `name LIKE 'E2E_TEST_%'` が 0 件
