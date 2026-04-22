import { test, expect } from "@playwright/test";

/**
 * 公開トップページの最低限の健康確認。
 * 本番URLを直叩きするため、副作用は一切持たない。
 */

test.describe("Home page", () => {
  test("loads with 200 and shows brand", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status()).toBe(200);
    await expect(page.getByText(/C5med Beauty/i).first()).toBeVisible();
  });

  test("lists all 7 stores", async ({ page }) => {
    await page.goto("/");
    const names = [
      "新神戸店",
      "札幌西11丁目店",
      "札幌北2条店",
      "名古屋ヒルトン", // "名古屋ヒルトン店" でも "名古屋ヒルトンプラザ店" でも一致
      "京都店",
      "新橋店",
      "福岡", // "福岡 C5クリニック内"
    ];

    for (const name of names) {
      await expect(
        page.getByText(new RegExp(name)).first(),
        `店舗名「${name}」が見つからない`
      ).toBeVisible();
    }
  });
});
