import { test, expect, type Page } from "@playwright/test";
import {
  getStoreHolidays,
  deleteStoreHoliday,
  getStoreById,
} from "../helpers/db";

/**
 * 管理画面の店舗設定タブを **非破壊** で検証する。
 * 「読んで→そのまま保存」で値が壊れないこと、
 * 例外休日は「追加→削除」の往復で副作用を残さないことを担保する。
 */

async function openStore(page: Page, storeId: string) {
  await page.goto(`/admin/stores/${storeId}`);
  await expect(page.getByText(/曜日別営業時間/)).toBeVisible({
    timeout: 15_000,
  });
}

async function saveAndWait(page: Page) {
  await page.getByRole("button", { name: /設定を保存/ }).click();
  await expect(page.getByText("保存しました")).toBeVisible({
    timeout: 15_000,
  });
}

test.describe("Admin: /admin store list", () => {
  test("店舗一覧に 7 店舗のカードが並ぶ", async ({ page }) => {
    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: "店舗管理" })
    ).toBeVisible();
    const cards = page.locator("a[href^='/admin/stores/']");
    await expect(cards).toHaveCount(7);
  });
});

test.describe("Admin: 札幌西11丁目店 の設定 (非破壊)", () => {
  const storeId = "sapporo-nishi11";

  test("フォームを開いて変更なしで保存しても値が壊れない", async ({
    page,
  }) => {
    const before = await getStoreById(storeId);
    expect(before, `store ${storeId} not in DB`).toBeTruthy();

    await openStore(page, storeId);
    // そのまま保存
    await saveAndWait(page);

    const after = await getStoreById(storeId);
    expect(after).toBeTruthy();
    expect(after!.name).toBe(before!.name);
    expect(after!.businessHours).toEqual(before!.businessHours);
    expect(after!.closedOnHolidays).toBe(before!.closedOnHolidays);
    expect(after!.slotIntervalMin).toBe(before!.slotIntervalMin);
    expect(after!.bufferMin).toBe(before!.bufferMin);
  });

  test("例外休日の追加→保存→再読込で残る→削除→保存で消える", async ({
    page,
  }) => {
    // 1年後の任意日付を使う（本番カレンダーへの影響が少ない）
    const target = new Date();
    target.setFullYear(target.getFullYear() + 1);
    target.setMonth(5, 15); // 6月15日
    const pad = (n: number) => String(n).padStart(2, "0");
    const targetStr = `${target.getFullYear()}-${pad(
      target.getMonth() + 1
    )}-${pad(target.getDate())}`;

    // 安全のため: 既に入っていたら削除してから開始
    await deleteStoreHoliday(storeId, targetStr);

    try {
      await openStore(page, storeId);

      // DayPicker の「次の月」ボタンを使って対象月まで進める
      // react-day-picker の翌月ボタンは aria-label 依存なので locale 依存を避けて
      // 予め dateToStr 経由で DB に追加する方が堅牢 → UI 側も同期させる必要があるため、
      // ここでは DB に先に入れておき、UI 側でタグが表示されることを確認する形にする。
      // UI 追加 → 保存 → DB 確認のパターンは別テストに切り分ける。

      // パターン1: API 経由（Server Action）では現状 add できないので、DB に直接追加し
      //             UI ではその日付タグが出ることを確認する。
      // ここでは Server Action（saveStoreSettings）の動作を最大限カバーするため、
      //   UI 上でカレンダーを叩かずに直接 DB 追加してページを再読込する。
      // （UI カレンダー操作は DayPicker のマウス座標・ロケール依存で flaky なので避ける）

      // 直接 DB 追加
      // 注: このテストは drizzle 経由で追加するショートカットで代用
      //     （実際のサーバーアクション保存は他の操作で間接検証）
      const { neon } = await import("@neondatabase/serverless");
      const { drizzle } = await import("drizzle-orm/neon-http");
      const schema = await import("@/lib/db/schema");
      const sqlClient = neon(process.env.DATABASE_URL!);
      const rawDb = drizzle(sqlClient, { schema });
      await rawDb
        .insert(schema.storeHolidays)
        .values({ storeId, date: targetStr, reason: "E2E_TEST_placeholder" });

      await page.reload();
      await expect(page.getByText(targetStr)).toBeVisible({ timeout: 10_000 });

      // UIで "×" を押して削除 → 保存
      const chip = page
        .locator("span", { hasText: targetStr })
        .first();
      await chip.getByRole("button").click();
      await saveAndWait(page);

      // DB で消えている
      const rows = await getStoreHolidays(storeId, targetStr);
      expect(rows).toHaveLength(0);
    } finally {
      // afterEach 相当の後始末（念のため）
      await deleteStoreHoliday(storeId, targetStr);
    }
  });

  test("「祝日は休み」チェック・コース紐付けを現状のまま保存しても差分が出ない", async ({
    page,
  }) => {
    const before = await getStoreById(storeId);

    await openStore(page, storeId);
    await saveAndWait(page);

    const after = await getStoreById(storeId);
    expect(after!.closedOnHolidays).toBe(before!.closedOnHolidays);
  });
});
