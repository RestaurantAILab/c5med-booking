import { test, expect, type Page } from "@playwright/test";
import path from "node:path";
import {
  getCourseByName,
  getCourseById,
  deleteCourseById,
} from "../helpers/db";
import { e2ePrefix } from "../helpers/test-data";

const TEST_IMAGE = path.resolve(
  __dirname,
  "../../tests/fixtures/test-image.png"
);

/**
 * コース管理画面のテスト。
 * 新規作成と削除は E2E_TEST_ プレフィックスの自作コースに限定する。
 * 既存コースに対しては読み取り→そのまま再保存の非破壊パターンのみ。
 */

async function gotoList(page: Page) {
  await page.goto("/admin/courses");
  await expect(
    page.getByRole("heading", { name: "コース管理" })
  ).toBeVisible();
}

test.describe("Admin: コース一覧", () => {
  test("19 コース以上が並ぶ", async ({ page }) => {
    await gotoList(page);
    const rows = page.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(19);
  });
});

test.describe("Admin: コース新規作成（画像付き） + 削除", () => {
  const createdIds: number[] = [];

  test.afterEach(async () => {
    // UI 経由で削除しなかった場合の fallback（Blob ファイルは残る可能性あり）
    const errors: string[] = [];
    for (const id of createdIds) {
      try {
        await deleteCourseById(id);
      } catch (err) {
        errors.push(
          `DB delete failed for course ${id}: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }
    createdIds.length = 0;
    if (errors.length > 0) {
      throw new Error(
        `クリーンアップ失敗 — 手動で DB を確認してください\n${errors.join(
          "\n"
        )}`
      );
    }
  });

  test("新規コースを作成→画像が Blob URL で保存→UI 削除で afterEach に残らない", async ({
    page,
  }) => {
    const name = `${e2ePrefix()} 新規テストコース`;

    await page.goto("/admin/courses/new");
    await page.getByRole("textbox", { name: /コース名/ }).fill(name);
    await page
      .getByRole("textbox", { name: /説明/ })
      .fill("E2E test course — safe to delete");
    await page.getByLabel(/カテゴリ/).selectOption("facial");
    await page.getByRole("spinbutton", { name: /所要時間/ }).fill("30");
    await page.getByRole("spinbutton", { name: /^価格/ }).fill("1000");
    await page.getByRole("textbox", { name: /タグ/ }).fill("E2E");

    // ファイル入力を直接セット
    await page.locator("input[type=file][name=image]").setInputFiles(TEST_IMAGE);

    await page.getByRole("button", { name: /^作成$/ }).click();

    // 保存成功 → /admin/courses/[id] にリダイレクト
    await page.waitForURL(/\/admin\/courses\/\d+$/, { timeout: 20_000 });

    // DB を見て画像URLが Vercel Blob になっていることを確認
    const row = await getCourseByName(name);
    expect(row, `course "${name}" not inserted`).toBeTruthy();
    createdIds.push(row!.id);

    expect(row!.imageUrl, "image_url が保存されていない").toBeTruthy();
    expect(row!.imageUrl ?? "").toMatch(
      /https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\//
    );

    // 一覧に出ていること
    await gotoList(page);
    await expect(page.getByText(name).first()).toBeVisible();

    // UI 削除で Blob + DB クリーンアップ
    await page.goto(`/admin/courses/${row!.id}`);
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /このコースを削除/ }).click();
    await page.waitForURL(/\/admin\/courses$/, { timeout: 20_000 });

    // DB 確認
    const gone = await getCourseById(row!.id);
    expect(gone).toBeUndefined();
    // afterEach が何も消さずに済むよう createdIds から外す
    createdIds.length = 0;
  });
});

test.describe("Admin: 既存コース編集 (非破壊)", () => {
  test("スカルプケアを読み取り→同じ値で再保存しても description が壊れない", async ({
    page,
  }) => {
    const nameKeyword = "スカルプケア";
    const before = await getCourseByName("スカルプケア 上清液使用 発毛／育毛／薄毛");
    expect(before, "スカルプケアが DB に存在しない").toBeTruthy();

    await page.goto(`/admin/courses/${before!.id}`);
    await expect(page.getByRole("heading", { name: /コースを編集/ })).toBeVisible();

    // 現在値をそのまま提出（フィールド値の変更なし）
    await page.getByRole("button", { name: /^更新$/ }).click();

    // 更新ボタンは pending 表示を経て落ち着くまで軽く待つ
    await page.waitForTimeout(1500);

    const after = await getCourseById(before!.id);
    expect(after).toBeTruthy();
    expect(after!.name).toBe(before!.name);
    expect(after!.description).toBe(before!.description);
    expect(after!.durationMin).toBe(before!.durationMin);
    expect(after!.price).toBe(before!.price);
    expect(after!.category).toBe(before!.category);
    expect(after!.imageUrl).toBe(before!.imageUrl);

    // UI 上の "スカルプケア" 文字が編集ページに残っている
    await expect(page.getByText(new RegExp(nameKeyword))).toBeVisible();
  });
});
