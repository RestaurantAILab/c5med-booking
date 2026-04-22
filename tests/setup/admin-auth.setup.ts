import { test as setup, expect } from "@playwright/test";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

/**
 * 管理画面の storageState を取得する setup。
 *
 * 初回のみ以下で実行すること:
 *   bun run test:e2e:setup-admin
 *
 * ブラウザが開くので、許可された Google アカウント
 *   (ADMIN_ALLOWED_EMAILS に含まれるもの、本プロジェクトでは restaurant.ai.lab@gmail.com)
 * で手動ログインすると、cookie が tests/.auth/admin.json に保存され
 * 以後 `--project=admin` のテストで再利用される。
 *
 * cookie には Google / NextAuth の session が含まれる。
 * このファイルは .gitignore 済み (tests/.auth/.gitignore)。
 */

setup.describe.configure({ mode: "serial" });

const STORAGE_STATE = "tests/.auth/admin.json";

setup("authenticate admin via Google OAuth", async ({ page }) => {
  const dir = dirname(STORAGE_STATE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  await page.goto("/admin/signin");

  console.log(
    "\n" +
      "=".repeat(70) +
      "\n" +
      "  [setup-admin] ブラウザで Googleアカウント (restaurant.ai.lab@gmail.com)\n" +
      "  で手動ログインしてください。最大 3 分待機します。\n" +
      "  ログイン後、自動的に /admin に遷移すれば storageState を保存します。\n" +
      "=".repeat(70) +
      "\n"
  );

  // 最大 3 分待ってログイン完了（/admin に遷移）を検知。
  // headed で起動してユーザーが手動ログインする想定。
  await page.waitForURL(/\/admin(\?.*)?$/, { timeout: 180_000 });

  // ダッシュボードが出ていることを確認
  await expect(page.getByRole("heading", { name: "店舗管理" })).toBeVisible({
    timeout: 30_000,
  });

  await page.context().storageState({ path: STORAGE_STATE });
  console.log(`\n  ✓ storageState saved → ${STORAGE_STATE}\n`);
});
