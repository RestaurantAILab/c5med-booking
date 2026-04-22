import { test, expect } from "@playwright/test";

/**
 * storageState ありで /admin にアクセスできることの確認。
 *
 * 実行は --project=admin（setup-admin の storageState に依存）で行う。
 *
 * 許可外メールでのログイン拒否は手動テストで確認すること:
 *   1. 許可リスト (ADMIN_ALLOWED_EMAILS) に含まれていない別のGoogleアカウントで
 *      /admin/signin から Googleログインを試みる
 *   2. /admin/signin に error=AccessDenied 付きでリダイレクトされ、
 *      「アクセス権限がありません」のメッセージが表示されることを確認する
 *   (storageState 方式では allowlist の自動テストが難しいので手動で確認)
 */

test.describe("Admin auth (storageState あり)", () => {
  test("/admin にアクセスでダッシュボードが開く", async ({ page }) => {
    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: "店舗管理" })
    ).toBeVisible();
    // ヘッダーにユーザーのメールが表示される
    await expect(page.getByText(/@/).first()).toBeVisible();
  });

  test("/admin/courses にアクセスでコース一覧が開く", async ({ page }) => {
    await page.goto("/admin/courses");
    await expect(
      page.getByRole("heading", { name: "コース管理" })
    ).toBeVisible();
  });
});
