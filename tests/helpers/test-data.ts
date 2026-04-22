/**
 * E2E テストのテストデータを生成するユーティリティ。
 * 生成される文字列は必ず `E2E_TEST_` プレフィックスを含み、
 * クリーンアップ処理からフィルタできる。
 */

export const E2E_EMAIL_DOMAIN = "e2e.c5med.example.com";
export const E2E_PREFIX = "E2E_TEST_";

/** `E2E_TEST_<ms_timestamp>` 形式のプレフィックス */
export function e2ePrefix(): string {
  return `${E2E_PREFIX}${Date.now()}`;
}

/** `E2E_TEST_<timestamp>@e2e.c5med.example.com` 形式のメール */
export function testEmail(prefix = e2ePrefix()): string {
  return `${prefix}@${E2E_EMAIL_DOMAIN}`;
}

/** テスト用氏名（Calendar summary・DB name に入る） */
export function testName(prefix = e2ePrefix()): string {
  return `${prefix}様`;
}

/** テスト用電話番号（架空の番号 090-0000-xxxx） */
export function testPhone(): string {
  const n = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `090-0000-${n}`;
}

/** テスト用備考 */
export function testNote(prefix = e2ePrefix()): string {
  return `${prefix} automated e2e test — safe to delete`;
}
