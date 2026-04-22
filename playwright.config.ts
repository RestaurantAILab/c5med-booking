import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

const STORAGE_STATE = "tests/.auth/admin.json";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL:
      process.env.E2E_BASE_URL ??
      "https://c5med-booking-restaurant-ai-lab.vercel.app",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
  },
  projects: [
    {
      name: "setup-admin",
      testMatch: /setup\/admin-auth\.setup\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "user",
      testMatch: /user\/.*\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "admin",
      testMatch: /admin\/.*\.spec\.ts$/,
      testIgnore: /admin\/auth\.unauth\.spec\.ts$/,
      dependencies: ["setup-admin"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: STORAGE_STATE,
      },
    },
    {
      // 認証なしで /admin にアクセスしたときのリダイレクト確認用
      name: "admin-unauth",
      testMatch: /admin\/auth\.unauth\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
