import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { stores, courses, storeHolidays } from "@/lib/db/schema";
import { availabilityQuerySchema } from "@/lib/validations";
import { generateSlots, filterAvailableSlots } from "@/lib/slot-generator";
import { getAvailabilityRange } from "@/lib/google-calendar";

async function getHolidayDatesInRange(
  storeId: string,
  startDate: string,
  endDate: string
): Promise<Set<string>> {
  const rows = await db
    .select({ date: storeHolidays.date })
    .from(storeHolidays)
    .where(
      and(
        eq(storeHolidays.storeId, storeId),
        gte(storeHolidays.date, startDate),
        lte(storeHolidays.date, endDate)
      )
    );
  return new Set(rows.map((r) => r.date));
}

const cache = new Map<string, { data: unknown; expiresAt: number }>();

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00+09:00`);
  d.setDate(d.getDate() + days);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = availabilityQuerySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { storeId, date, weekStart, courseId } = parsed.data;

  if (!date && !weekStart) {
    return NextResponse.json(
      { error: "date or weekStart is required" },
      { status: 400 }
    );
  }

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

  // Week mode: return 7 days of slots
  if (weekStart) {
    const dates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const endDate = dates[6];

    const holidays = await getHolidayDatesInRange(
      store.id,
      weekStart,
      endDate
    ).catch(() => new Set<string>());

    // Generate slots for each day (skip holiday dates)
    const allSlots: Record<string, { start: string; end: string }[]> = {};
    const availableSlots: Record<string, { start: string; end: string }[]> = {};

    for (const d of dates) {
      if (holidays.has(d)) {
        allSlots[d] = [];
        continue;
      }
      allSlots[d] = generateSlots(
        store.businessHours,
        d,
        course.durationMin,
        store.businessHours.slot_interval_min
      );
    }

    // ダミーカレンダーIDの場合はFreeBusyをスキップ
    if (store.calendarId.endsWith("@c5med.example.com")) {
      for (const d of dates) {
        availableSlots[d] = allSlots[d];
      }
      return NextResponse.json({ slots: availableSlots });
    }

    // FreeBusy for the whole week (single API call)
    const cacheKey = `${store.calendarId}:week:${weekStart}`;
    let busyPeriods;
    const cached = cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      busyPeriods = cached.data as Awaited<
        ReturnType<typeof getAvailabilityRange>
      >;
    } else {
      try {
        busyPeriods = await getAvailabilityRange(
          store.calendarId,
          weekStart,
          endDate,
          store.timezone
        );
        cache.set(cacheKey, {
          data: busyPeriods,
          expiresAt: Date.now() + 60_000,
        });
      } catch (err) {
        console.error("FreeBusy query failed:", err);
        for (const d of dates) {
          availableSlots[d] = allSlots[d];
        }
        return NextResponse.json({ slots: availableSlots });
      }
    }

    for (const d of dates) {
      availableSlots[d] = filterAvailableSlots(allSlots[d], busyPeriods);
    }

    return NextResponse.json({ slots: availableSlots });
  }

  // Single day mode (backward compatible)
  const singleDate = date!;
  const singleHolidays = await getHolidayDatesInRange(
    store.id,
    singleDate,
    singleDate
  ).catch(() => new Set<string>());
  if (singleHolidays.has(singleDate)) {
    return NextResponse.json({ slots: [] });
  }

  const slots = generateSlots(
    store.businessHours,
    singleDate,
    course.durationMin,
    store.businessHours.slot_interval_min
  );

  if (slots.length === 0) {
    return NextResponse.json({ slots: [] });
  }

  if (store.calendarId.endsWith("@c5med.example.com")) {
    return NextResponse.json({ slots });
  }

  const cacheKey = `${store.calendarId}:${singleDate}`;
  let busyPeriods;
  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    busyPeriods = cached.data as Awaited<
      ReturnType<typeof getAvailabilityRange>
    >;
  } else {
    try {
      busyPeriods = await getAvailabilityRange(
        store.calendarId,
        singleDate,
        singleDate,
        store.timezone
      );
      cache.set(cacheKey, {
        data: busyPeriods,
        expiresAt: Date.now() + 60_000,
      });
    } catch (err) {
      console.error("FreeBusy query failed:", err);
      return NextResponse.json({ slots });
    }
  }

  const available = filterAvailableSlots(slots, busyPeriods);
  return NextResponse.json({ slots: available });
}
