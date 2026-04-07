import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { stores, courses, bookings } from "@/lib/db/schema";
import { bookingSchema } from "@/lib/validations";
import { getAvailability, createBookingEvent, deleteEvent } from "@/lib/google-calendar";
import { sendConfirmation } from "@/lib/email";

// Simple in-memory rate limiter: 10 requests per hour per IP
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const hourAgo = now - 3600_000;
  const timestamps = (rateLimitMap.get(ip) ?? []).filter((t) => t > hourAgo);
  rateLimitMap.set(ip, timestamps);
  return timestamps.length < 10;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "予約リクエストが多すぎます。しばらくしてからお試しください。" },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const [store] = await db
    .select()
    .from(stores)
    .where(eq(stores.id, data.storeId))
    .limit(1);

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, data.courseId))
    .limit(1);

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  // Live FreeBusy check (no cache)
  const bookedAt = new Date(data.bookedAt);
  const endAt = new Date(bookedAt.getTime() + course.durationMin * 60_000);
  const dateStr = data.bookedAt.slice(0, 10);

  const busyPeriods = await getAvailability(
    store.calendarId,
    dateStr,
    store.timezone
  );

  const isConflict = busyPeriods.some((busy) => {
    const busyStart = new Date(busy.start).getTime();
    const busyEnd = new Date(busy.end).getTime();
    return bookedAt.getTime() < busyEnd && endAt.getTime() > busyStart;
  });

  if (isConflict) {
    return NextResponse.json(
      { error: "この時間帯はすでに予約が入っています。別の時間をお選びください。" },
      { status: 409 }
    );
  }

  // Record rate limit hit
  const timestamps = rateLimitMap.get(ip) ?? [];
  timestamps.push(Date.now());
  rateLimitMap.set(ip, timestamps);

  // Create Calendar event
  let eventId: string;
  try {
    eventId = await createBookingEvent(store.calendarId, {
      storeName: store.name,
      courseName: course.name,
      customerName: data.name,
      email: data.email,
      phone: data.phone,
      note: data.note,
      startTime: data.bookedAt,
      endTime: endAt.toISOString(),
      timezone: store.timezone,
    });
  } catch (err) {
    console.error("Calendar event creation failed:", err);
    return NextResponse.json(
      { error: "予約の登録に失敗しました。" },
      { status: 500 }
    );
  }

  // Insert booking log into Neon
  let bookingId: number;
  try {
    const [inserted] = await db
      .insert(bookings)
      .values({
        storeId: data.storeId,
        courseId: data.courseId,
        email: data.email,
        name: data.name,
        phone: data.phone,
        note: data.note,
        bookedAt,
        calendarEventId: eventId,
      })
      .returning({ id: bookings.id });
    bookingId = inserted.id;
  } catch (err) {
    console.error("DB insert failed, rolling back calendar event:", err);
    await deleteEvent(store.calendarId, eventId).catch(() => {});
    return NextResponse.json(
      { error: "予約の登録に失敗しました。" },
      { status: 500 }
    );
  }

  // Send confirmation email (best-effort)
  try {
    await sendConfirmation({
      email: data.email,
      name: data.name,
      storeName: store.name,
      courseName: course.name,
      price: course.price,
      bookedAt: data.bookedAt,
    });
  } catch (err) {
    console.error("Email send failed:", err);
  }

  return NextResponse.json({ bookingId, eventId }, { status: 201 });
}
