import { notFound } from "next/navigation";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  stores,
  courses,
  storeCourses,
  storeHolidays,
} from "@/lib/db/schema";
import { StoreSettingsForm } from "./StoreSettingsForm";

export const dynamic = "force-dynamic";

export default async function StoreEditPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;

  const [store] = await db
    .select()
    .from(stores)
    .where(eq(stores.id, storeId))
    .limit(1);

  if (!store) notFound();

  const allCourses = await db
    .select()
    .from(courses)
    .orderBy(asc(courses.sortOrder), asc(courses.id));

  const linked = await db
    .select({ courseId: storeCourses.courseId })
    .from(storeCourses)
    .where(eq(storeCourses.storeId, storeId));
  const linkedCourseIds = linked.map((r) => r.courseId);

  const holidayRows = await db
    .select({ date: storeHolidays.date })
    .from(storeHolidays)
    .where(eq(storeHolidays.storeId, storeId))
    .orderBy(asc(storeHolidays.date));
  const holidayDates = holidayRows.map((r) => r.date);

  return (
    <main className="max-w-[1080px] mx-auto px-6 py-10">
      <div className="mb-6">
        <Link
          href="/admin"
          className="text-[12px] text-[#6b6560] hover:text-[#a88b2f]"
        >
          ← 店舗一覧
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-[#3a3632]">{store.name}</h1>
        <p className="text-[13px] text-[#6b6560] mt-1">
          営業時間・例外休日・基本情報・コース紐付けを編集します
        </p>
      </div>

      <StoreSettingsForm
        store={store}
        allCourses={allCourses.map((c) => ({
          id: c.id,
          name: c.name,
          category: c.category,
          durationMin: c.durationMin,
          price: c.price,
        }))}
        linkedCourseIds={linkedCourseIds}
        holidayDates={holidayDates}
      />
    </main>
  );
}
