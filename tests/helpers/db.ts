import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { and, eq, inArray, like } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import { E2E_PREFIX } from "./test-data";

let _db: NeonHttpDatabase<typeof schema> | null = null;

function getDb(): NeonHttpDatabase<typeof schema> {
  if (_db) return _db;
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error(
      "DATABASE_URL が未設定です。.env を確認してください（E2E ヘルパーは本番DBに接続します）"
    );
  }
  const parsed = new URL(dbUrl);
  parsed.searchParams.delete("channel_binding");
  const sql = neon(parsed.toString());
  _db = drizzle(sql, { schema });
  return _db;
}

export type BookingRow = typeof schema.bookings.$inferSelect;
export type CourseRow = typeof schema.courses.$inferSelect;
export type StoreRow = typeof schema.stores.$inferSelect;

/**
 * E2E_TEST_ プレフィックスの email を持つ bookings を全て取得。
 * デフォルトは今回のテスト固有プレフィックスで絞り込むこと（他テスト分を巻き込まないため）。
 */
export async function getBookingsByEmailPrefix(
  prefix: string = E2E_PREFIX
): Promise<BookingRow[]> {
  const db = getDb();
  return db
    .select()
    .from(schema.bookings)
    .where(like(schema.bookings.email, `${prefix}%`));
}

export async function getBookingById(
  id: number
): Promise<BookingRow | undefined> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.bookings)
    .where(eq(schema.bookings.id, id))
    .limit(1);
  return row;
}

export async function deleteBookingsByIds(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  const db = getDb();
  await db.delete(schema.bookings).where(inArray(schema.bookings.id, ids));
}

export async function deleteBookingsByEmail(email: string): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ id: schema.bookings.id })
    .from(schema.bookings)
    .where(eq(schema.bookings.email, email));
  const ids = rows.map((r) => r.id);
  await deleteBookingsByIds(ids);
  return ids.length;
}

export async function getStoreById(
  storeId: string
): Promise<StoreRow | undefined> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.stores)
    .where(eq(schema.stores.id, storeId))
    .limit(1);
  return row;
}

export async function getCourseByName(
  name: string
): Promise<CourseRow | undefined> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.courses)
    .where(eq(schema.courses.name, name))
    .limit(1);
  return row;
}

export async function getCourseById(
  id: number
): Promise<CourseRow | undefined> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.courses)
    .where(eq(schema.courses.id, id))
    .limit(1);
  return row;
}

export async function deleteCourseById(id: number): Promise<void> {
  const db = getDb();
  // storeCourses の外部キーを先に削除
  await db
    .delete(schema.storeCourses)
    .where(eq(schema.storeCourses.courseId, id));
  // bookings の course_id も NULL に戻す（参照保護）
  await db
    .update(schema.bookings)
    .set({ courseId: null })
    .where(eq(schema.bookings.courseId, id));
  await db.delete(schema.courses).where(eq(schema.courses.id, id));
}

export async function getStoreHolidays(
  storeId: string,
  date?: string
): Promise<{ id: number; date: string }[]> {
  const db = getDb();
  const where = date
    ? and(
        eq(schema.storeHolidays.storeId, storeId),
        eq(schema.storeHolidays.date, date)
      )
    : eq(schema.storeHolidays.storeId, storeId);
  return db
    .select({ id: schema.storeHolidays.id, date: schema.storeHolidays.date })
    .from(schema.storeHolidays)
    .where(where);
}

export async function deleteStoreHoliday(
  storeId: string,
  date: string
): Promise<void> {
  const db = getDb();
  await db
    .delete(schema.storeHolidays)
    .where(
      and(
        eq(schema.storeHolidays.storeId, storeId),
        eq(schema.storeHolidays.date, date)
      )
    );
}
