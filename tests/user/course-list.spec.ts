import { test, expect } from "@playwright/test";

const UPPER_LIQUID_COURSES = [
  "針ナシ注射(ノンニードル)リフトアップ",
  "針ナシ注射(ノンニードル)赤み／ニキビ跡",
  "針ナシ注射(ノンニードル)ホワイトニング",
  "針ナシ注射(ノンニードル)潤い／ツヤ",
  "ペインケア(ノンニードル)肩こり／腰痛／膝痛",
  "痩身(ノンニードル)",
];

const UPPER_LIQUID_NOTE = "※上清液あり ＋6,600円";

test.describe("Course list — 札幌西11丁目店", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/stores/sapporo-nishi11");
    // BookingWidget がコースをAPIロードするのを待つ
    await expect(
      page.getByText(/コースを選択してください/).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test("19 コースが表示される", async ({ page }) => {
    // API から取得したコースは <button> として描画される（CourseList のボタン）
    const courseButtons = page.locator(
      "main button:has-text('分')"
    );
    // 一部のボタンは progress step にも "分" が入らないが、価格表示と duration で絞り込み:
    const priceChips = page.locator("main button >> text=/¥\\d/");
    await expect(priceChips).toHaveCount(19, { timeout: 15_000 });
    expect(await courseButtons.count()).toBeGreaterThanOrEqual(19);
  });

  for (const name of UPPER_LIQUID_COURSES) {
    test(`「${name}」の説明に上清液注記 (${UPPER_LIQUID_NOTE}) が含まれる`, async ({
      page,
    }) => {
      const card = page.locator("button", { hasText: name }).first();
      await expect(card).toBeVisible();
      await expect(card).toContainText(UPPER_LIQUID_NOTE);
    });
  }

  test("コースカードに画像 or プレースホルダが表示される", async ({ page }) => {
    // CourseList は imageUrl があれば <img>、なければ星型SVGプレースホルダ
    const firstCard = page.locator("main button:has-text('分')").first();
    await expect(firstCard).toBeVisible();
    const hasImg = (await firstCard.locator("img").count()) > 0;
    const hasPlaceholderSvg = (await firstCard.locator("svg").count()) > 0;
    expect(hasImg || hasPlaceholderSvg).toBe(true);
  });
});
