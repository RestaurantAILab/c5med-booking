import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { and, eq, gte, lte } from "drizzle-orm";
import { google } from "googleapis";
import * as schema from "@/lib/db/schema";

/**
 * 指定店舗の Google Calendar の直近イベントを表示し、
 * DB の bookings テーブルと付き合わせて表示するデバッグ CLI。
 *
 * 使い方:
 *   bun run scripts/verify-calendar-booking.ts <storeId> [days]
 *
 *   storeId は stores.id (例: "sapporo-nishi11")
 *   days は前後の日数 (デフォルト 7)
 *
 * 例:
 *   bun run scripts/verify-calendar-booking.ts sapporo-nishi11 14
 */

async function main() {
  const storeId = process.argv[2];
  const days = Number(process.argv[3] ?? 7);

  if (!storeId || Number.isNaN(days)) {
    console.error(
      "Usage: bun run scripts/verify-calendar-booking.ts <storeId> [days]"
    );
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is not set");
  }

  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.delete("channel_binding");
  const sql = neon(url.toString());
  const db = drizzle(sql, { schema });

  const [store] = await db
    .select()
    .from(schema.stores)
    .where(eq(schema.stores.id, storeId))
    .limit(1);

  if (!store) {
    console.error(`Store not found: ${storeId}`);
    process.exit(1);
  }

  const now = new Date();
  const from = new Date(now.getTime() - days * 24 * 3600_000);
  const to = new Date(now.getTime() + days * 24 * 3600_000);

  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  const calendar = google.calendar({ version: "v3", auth });

  const res = await calendar.events.list({
    calendarId: store.calendarId,
    timeMin: from.toISOString(),
    timeMax: to.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  });
  const events = res.data.items ?? [];

  // 同じ期間の DB bookings
  const fromISO = from.toISOString();
  const toISO = to.toISOString();
  const bookings = await db
    .select()
    .from(schema.bookings)
    .where(
      and(
        eq(schema.bookings.storeId, storeId),
        gte(schema.bookings.bookedAt, new Date(fromISO)),
        lte(schema.bookings.bookedAt, new Date(toISO))
      )
    );

  const bookingByEventId = new Map<string, (typeof bookings)[number]>();
  for (const b of bookings) {
    if (b.calendarEventId) bookingByEventId.set(b.calendarEventId, b);
  }

  console.log(
    `=== ${store.name} (${storeId}) — events in ±${days} days ===\n`
  );
  console.log(`Calendar:  ${store.calendarId}`);
  console.log(`Events:    ${events.length}`);
  console.log(`Bookings:  ${bookings.length}\n`);

  for (const ev of events) {
    const start = ev.start?.dateTime ?? ev.start?.date;
    const match = ev.id ? bookingByEventId.get(ev.id) : undefined;
    const matchStr = match
      ? `  ✓ DB booking #${match.id} (${match.email})`
      : `  ✗ no matching DB row`;
    console.log(
      `[${start}] ${ev.summary ?? "(no summary)"} — event ${ev.id}\n${matchStr}`
    );
  }

  // DB にあって Calendar にない
  const orphan = bookings.filter(
    (b) => !b.calendarEventId || !events.some((e) => e.id === b.calendarEventId)
  );
  if (orphan.length > 0) {
    console.log("\n=== DB-only bookings (Calendar event missing) ===");
    for (const b of orphan) {
      console.log(
        `  booking #${b.id}  ${b.bookedAt.toISOString?.() ?? b.bookedAt}  ${b.email}  eventId=${b.calendarEventId ?? "null"}`
      );
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
