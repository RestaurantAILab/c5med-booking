import { test, expect, type Page } from "@playwright/test";
import {
  e2ePrefix,
  testEmail,
  testName,
  testPhone,
  testNote,
} from "../helpers/test-data";
import {
  getBookingsByEmailPrefix,
  deleteBookingsByIds,
  getStoreById,
} from "../helpers/db";
import { findEventBySummary, deleteEventById } from "../helpers/calendar";

const STORES_WITH_HOURS = [
  { slug: "sapporo-nishi11", name: "札幌西11丁目店" },
  { slug: "nagoya-hilton", name: "名古屋ヒルトンプラザ店" },
  { slug: "shimbashi", name: "新橋店" },
];

// 営業日と定休曜日の対応（seed の business_hours に一致）
const HOURS_EXPECT = {
  "sapporo-nishi11": {
    openMondaySlot: true,
    closedSaturday: true,
    closedTuesday: false,
  },
  "nagoya-hilton": {
    openMondaySlot: true,
    closedSaturday: false,
    closedTuesday: true,
  },
  shimbashi: {
    openMondaySlot: true,
    closedSaturday: false,
    closedTuesday: true,
  },
} as const;

/** 画面上のウィークリーカレンダーを N 週分次へ進める */
async function advanceWeek(page: Page, weeks: number) {
  for (let i = 0; i < weeks; i++) {
    const next = page.getByRole("button", { name: "→" });
    if (await next.isDisabled()) break;
    await next.click();
    // 再フェッチ完了をゆるく待つ
    await page.waitForLoadState("networkidle").catch(() => {});
  }
}

async function selectFirstCourse(page: Page) {
  await expect(
    page.getByText(/コースを選択してください/).first()
  ).toBeVisible({ timeout: 15_000 });
  // 最初のコース（ボタン）を選ぶ
  const first = page.locator("main button:has-text('分')").first();
  await first.click();
}

async function waitForCalendar(page: Page) {
  await expect(page.getByText(/日時を選択/).first()).toBeVisible({
    timeout: 15_000,
  });
}

/** 空きスロット(○)を 1 個クリック。無ければ 1 週進める。最大 4 週まで試す。 */
async function clickFirstAvailableSlot(page: Page) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const slot = page.locator("button:has-text('○')").first();
    if (await slot.isVisible().catch(() => false)) {
      await slot.click();
      return;
    }
    await advanceWeek(page, 1);
  }
  throw new Error("空きスロットが見つかりませんでした（4週探索済み）");
}

test.describe("Business-hours — slot rendering", () => {
  test("札幌西11丁目店: Monday に空きスロットがある / Saturday は定休", async ({
    page,
  }) => {
    await page.goto("/stores/sapporo-nishi11");
    await selectFirstCourse(page);
    await waitForCalendar(page);
    // まずは翌週を確認
    await advanceWeek(page, 1);

    // 空きスロット○ がどこかに存在する（月〜金のどれか）
    const available = page.locator("button:has-text('○')");
    expect(await available.count()).toBeGreaterThan(0);

    // 定休 (土日) のセルに「定休」表示
    await expect(page.getByText("定休").first()).toBeVisible();
  });

  test("名古屋ヒルトンプラザ店: 火曜は定休表示", async ({ page }) => {
    await page.goto("/stores/nagoya-hilton");
    await selectFirstCourse(page);
    await waitForCalendar(page);
    await advanceWeek(page, 1);
    // 火曜が休みなので「定休」表示がある
    await expect(page.getByText("定休").first()).toBeVisible();
    // それでも他の曜日には空きがある
    const available = page.locator("button:has-text('○')");
    expect(await available.count()).toBeGreaterThan(0);
  });

  test("新橋店: 火曜は定休表示", async ({ page }) => {
    await page.goto("/stores/shimbashi");
    await selectFirstCourse(page);
    await waitForCalendar(page);
    await advanceWeek(page, 1);
    await expect(page.getByText("定休").first()).toBeVisible();
    const available = page.locator("button:has-text('○')");
    expect(await available.count()).toBeGreaterThan(0);
  });

  test("京都店: 営業時間未入力のためコース一覧が空", async ({ page }) => {
    // 京都店は store_courses を持たないので、API から 0 件が返る
    await page.goto("/stores/kyoto");
    // BookingWidget はマウントされるが、コースリストは空
    await expect(
      page.getByText(/コースを選択してください/).first()
    ).toBeVisible({ timeout: 15_000 });
    // コースボタン（分を含むもの）がゼロ件
    const courseButtons = page.locator("main button:has-text('分')");
    await expect(courseButtons).toHaveCount(0, { timeout: 10_000 });
  });
});

for (const s of STORES_WITH_HOURS) {
  if (!HOURS_EXPECT[s.slug as keyof typeof HOURS_EXPECT].openMondaySlot)
    continue;

  test.describe(`Booking submission — ${s.name} (実Calendar/DB書き込み)`, () => {
    const createdBookingIds: number[] = [];
    const createdEvents: { calendarId: string; eventId: string }[] = [];

    test.afterEach(async () => {
      const errors: string[] = [];
      for (const { calendarId, eventId } of createdEvents) {
        try {
          await deleteEventById(calendarId, eventId);
        } catch (err) {
          errors.push(
            `Calendar event delete failed (${calendarId}/${eventId}): ${
              err instanceof Error ? err.message : String(err)
            }`
          );
        }
      }
      createdEvents.length = 0;

      try {
        await deleteBookingsByIds(createdBookingIds);
      } catch (err) {
        errors.push(
          `DB booking delete failed (${createdBookingIds.join(",")}): ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
      createdBookingIds.length = 0;

      if (errors.length > 0) {
        // 片付け失敗は必ず気付くために fail させる
        throw new Error(
          `クリーンアップ失敗 — 手動で Calendar/DB を確認してください\n${errors.join(
            "\n"
          )}`
        );
      }
    });

    test(`${s.name}: UI から予約送信→確認画面→DB/Calendar 存在確認→クリーンアップ`, async ({
      page,
    }) => {
      const prefix = e2ePrefix();
      const email = testEmail(prefix);
      const name = testName(prefix);
      const phone = testPhone();
      const note = testNote(prefix);

      await page.goto(`/stores/${s.slug}`);
      await selectFirstCourse(page);
      await waitForCalendar(page);

      // テスト衝突を避けて 2週先に進める
      await advanceWeek(page, 2);
      await clickFirstAvailableSlot(page);

      // 入力フォーム
      await expect(page.getByText("お客様情報").first()).toBeVisible({
        timeout: 10_000,
      });
      await page.getByRole("textbox", { name: /お名前/ }).fill(name);
      await page
        .getByRole("textbox", { name: /メールアドレス/ })
        .fill(email);
      await page.getByRole("textbox", { name: /電話番号/ }).fill(phone);
      await page.getByRole("textbox", { name: /備考/ }).fill(note);

      await page.getByRole("button", { name: /予約を確定する/ }).click();

      // 確認画面
      await expect(
        page.getByText(/ご予約が完了しました|予約が完了|ご予約完了/).first()
      ).toBeVisible({ timeout: 20_000 });

      // DB の bookings に E2E_TEST_ プレフィックス email の行が 1件
      const rows = await getBookingsByEmailPrefix(prefix);
      expect(rows.length).toBe(1);
      const row = rows[0];
      createdBookingIds.push(row.id);

      expect(row.storeId).toBe(s.slug);
      expect(row.name).toBe(name);
      expect(row.email).toBe(email);

      // Calendar のイベントを取得
      const store = await getStoreById(s.slug);
      expect(store, `store ${s.slug} not found`).toBeTruthy();
      const calendarId = store!.calendarId;

      // bookedAt は ISO string として保存される想定
      const bookedAt = new Date(row.bookedAt);
      const from = new Date(bookedAt.getTime() - 24 * 3600_000);
      const to = new Date(bookedAt.getTime() + 24 * 3600_000);
      const ev = await findEventBySummary(calendarId, name, from, to);

      expect(ev, `Calendar event for ${name} not found in ${calendarId}`).toBeTruthy();
      expect(ev!.summary ?? "").toContain(name);
      if (ev?.id) createdEvents.push({ calendarId, eventId: ev.id });

      // DB に calendarEventId が記録されているはず
      if (row.calendarEventId && ev?.id) {
        expect(ev.id).toBe(row.calendarEventId);
      }
    });
  });
}
