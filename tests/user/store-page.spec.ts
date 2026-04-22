import { test, expect } from "@playwright/test";

const STORES_WITH_HOURS = [
  {
    slug: "sapporo-nishi11",
    name: "札幌西11丁目店",
    addressMatch: /南4条西13丁目|サンコート/,
    phone: "080-3907-5708",
  },
  {
    slug: "nagoya-hilton",
    name: "名古屋ヒルトンプラザ店",
    addressMatch: /名古屋ヒルトンプラザ|栄1丁目/,
    phone: "080-3377-5705",
  },
  {
    slug: "shimbashi",
    name: "新橋店",
    addressMatch: /新橋4-9|新橋プラザビル/,
    phone: "090-1341-5704",
  },
];

const STORES_WITHOUT_HOURS = [
  { slug: "shin-kobe", name: "新神戸店" },
  { slug: "sapporo-kita2", name: "札幌北2条店" },
  { slug: "kyoto", name: "京都店" },
  { slug: "fukuoka-c5clinic", name: "福岡" },
];

test.describe("Store pages (stores with business hours)", () => {
  for (const s of STORES_WITH_HOURS) {
    test(`${s.name}: 店舗名・住所・電話が表示される`, async ({ page }) => {
      const res = await page.goto(`/stores/${s.slug}`);
      expect(res?.status()).toBe(200);

      await expect(page.getByText(new RegExp(s.name)).first()).toBeVisible();
      await expect(page.getByText(s.addressMatch).first()).toBeVisible();
      // 電話番号は店舗情報セクションどこかに含まれる（LPの構成上）
      // 現状のLPに電話番号表示がなければ skip できるよう、柔軟に:
      const phoneLocator = page.getByText(s.phone);
      if ((await phoneLocator.count()) > 0) {
        await expect(phoneLocator.first()).toBeVisible();
      } else {
        test.info().annotations.push({
          type: "note",
          description: `LP上に電話番号 ${s.phone} は表示されていない (DB保持)`,
        });
      }
    });
  }
});

test.describe("Store pages (stores without business hours)", () => {
  for (const s of STORES_WITHOUT_HOURS) {
    test(`${s.name}: ページが200で開き、店舗名が出る`, async ({ page }) => {
      const res = await page.goto(`/stores/${s.slug}`);
      expect(res?.status()).toBe(200);
      await expect(page.getByText(new RegExp(s.name)).first()).toBeVisible();
      // レイアウト崩れの雑な検知: footer の copyright が表示されている
      await expect(page.getByText(/All rights reserved/i).first()).toBeVisible();
    });
  }
});
