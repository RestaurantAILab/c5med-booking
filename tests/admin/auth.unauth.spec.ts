import { test, expect } from "@playwright/test";

/**
 * storageState **なし** で /admin にアクセスした場合に
 * /admin/signin にリダイレクトされることを確認する。
 * --project=admin-unauth で実行される（認証なし）。
 */

test.describe("Admin auth (未認証)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("/admin にアクセスすると /admin/signin にリダイレクト", async ({
    page,
  }) => {
    const res = await page.goto("/admin");
    // proxy/middleware リダイレクトで最終URLが /admin/signin に
    expect(page.url()).toContain("/admin/signin");
    expect(res?.ok()).toBeTruthy();
    await expect(
      page.getByRole("heading", { name: /管理画面ログイン/ })
    ).toBeVisible();
  });

  test("/admin/courses もサインインにリダイレクト", async ({ page }) => {
    await page.goto("/admin/courses");
    expect(page.url()).toContain("/admin/signin");
  });
});
