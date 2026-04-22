"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  stores,
  storeCourses,
  storeHolidays,
  type BusinessHours,
} from "@/lib/db/schema";
import { auth } from "@/auth";

const TIME_RE = /^\d{2}:\d{2}$/;
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const rangeSchema = z
  .object({ start: z.string().regex(TIME_RE), end: z.string().regex(TIME_RE) })
  .refine((r) => r.start < r.end, {
    message: "開始は終了より前",
  });

const businessHoursDaySchema = z.array(rangeSchema);

const settingsSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  nearestStation: z.string().optional().nullable(),
  calendarId: z.string().min(1),
  timezone: z.string().min(1),
  slotIntervalMin: z.coerce.number().int().min(5).max(120),
  bufferMin: z.coerce.number().int().min(0).max(120),
  lastAcceptMinBeforeClose: z.coerce.number().int().min(0).max(240),
  advanceBookingDays: z.coerce.number().int().min(1).max(365),
  closedOnHolidays: z.boolean(),
  businessHours: z.record(z.enum(DAY_KEYS), businessHoursDaySchema),
  holidayDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  courseIds: z.array(z.coerce.number().int()),
});

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function saveStoreSettings(
  storeId: string,
  formData: FormData
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAuth();

  const payloadRaw = formData.get("payload");
  if (typeof payloadRaw !== "string") {
    return { ok: false, error: "Invalid payload" };
  }
  let parsed;
  try {
    parsed = settingsSchema.parse(JSON.parse(payloadRaw));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Validation error";
    return { ok: false, error: msg };
  }

  const businessHours: BusinessHours = {
    slot_interval_min: parsed.slotIntervalMin,
  };
  for (const day of DAY_KEYS) {
    const ranges = parsed.businessHours[day] ?? [];
    businessHours[day] = ranges.map((r) => `${r.start}-${r.end}`);
  }

  await db
    .update(stores)
    .set({
      name: parsed.name,
      address: parsed.address ?? null,
      phone: parsed.phone ?? null,
      nearestStation: parsed.nearestStation ?? null,
      calendarId: parsed.calendarId,
      timezone: parsed.timezone,
      slotIntervalMin: parsed.slotIntervalMin,
      bufferMin: parsed.bufferMin,
      lastAcceptMinBeforeClose: parsed.lastAcceptMinBeforeClose,
      advanceBookingDays: parsed.advanceBookingDays,
      closedOnHolidays: parsed.closedOnHolidays,
      businessHours,
    })
    .where(eq(stores.id, storeId));

  // 例外休日を全入れ替え
  await db.delete(storeHolidays).where(eq(storeHolidays.storeId, storeId));
  if (parsed.holidayDates.length > 0) {
    const unique = Array.from(new Set(parsed.holidayDates));
    await db.insert(storeHolidays).values(
      unique.map((d) => ({
        storeId,
        date: d,
        reason: null,
      }))
    );
  }

  // コース紐付けを全入れ替え
  await db.delete(storeCourses).where(eq(storeCourses.storeId, storeId));
  if (parsed.courseIds.length > 0) {
    const unique = Array.from(new Set(parsed.courseIds));
    await db.insert(storeCourses).values(
      unique.map((cid) => ({ storeId, courseId: cid }))
    );
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/stores/${storeId}`);
  revalidatePath(`/stores/${storeId}`);
  return { ok: true };
}

// deleting a store holiday directly (optional helper, currently used via save)
export async function deleteStoreHoliday(storeId: string, date: string) {
  await requireAuth();
  await db
    .delete(storeHolidays)
    .where(
      and(eq(storeHolidays.storeId, storeId), eq(storeHolidays.date, date))
    );
  revalidatePath(`/admin/stores/${storeId}`);
}

export async function unlinkCourses(storeId: string, courseIds: number[]) {
  await requireAuth();
  if (courseIds.length === 0) return;
  await db
    .delete(storeCourses)
    .where(
      and(
        eq(storeCourses.storeId, storeId),
        inArray(storeCourses.courseId, courseIds)
      )
    );
  revalidatePath(`/admin/stores/${storeId}`);
}
