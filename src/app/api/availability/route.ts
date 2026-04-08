import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { stores, courses } from "@/lib/db/schema";
import { availabilityQuerySchema } from "@/lib/validations";
import { generateSlots, filterAvailableSlots } from "@/lib/slot-generator";
import { getAvailability } from "@/lib/google-calendar";

const cache = new Map<string, { data: unknown; expiresAt: number }>();

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = availabilityQuerySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { storeId, date, courseId } = parsed.data;

  let store, course;
  try {
    const [s] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);
    store = s;
  } catch (err) {
    console.error("DB query failed (stores):", err);
    return NextResponse.json(
      { error: "データベース接続エラー" },
      { status: 500 }
    );
  }

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  try {
    const [c] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);
    course = c;
  } catch (err) {
    console.error("DB query failed (courses):", err);
    return NextResponse.json(
      { error: "データベース接続エラー" },
      { status: 500 }
    );
  }

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const slots = generateSlots(
    store.businessHours,
    date,
    course.durationMin,
    store.businessHours.slot_interval_min
  );

  if (slots.length === 0) {
    return NextResponse.json({ slots: [] });
  }

  // ダミーカレンダーIDの場合はFreeBusyをスキップし全スロットを返す
  if (store.calendarId.endsWith("@c5med.example.com")) {
    return NextResponse.json({ slots });
  }

  // FreeBusy cache (60s)
  const cacheKey = `${store.calendarId}:${date}`;
  let busyPeriods;
  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    busyPeriods = cached.data as Awaited<ReturnType<typeof getAvailability>>;
  } else {
    try {
      busyPeriods = await getAvailability(
        store.calendarId,
        date,
        store.timezone
      );
      cache.set(cacheKey, {
        data: busyPeriods,
        expiresAt: Date.now() + 60_000,
      });
    } catch (err) {
      console.error("FreeBusy query failed:", err);
      // Calendar APIエラー時はスロット生成結果をそのまま返す（予約時に再チェック）
      return NextResponse.json({ slots });
    }
  }

  const available = filterAvailableSlots(slots, busyPeriods);

  return NextResponse.json({ slots: available });
}
