import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { CourseEditor } from "../CourseEditor";

export const dynamic = "force-dynamic";

export default async function CourseEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const courseId = Number(id);
  if (!Number.isFinite(courseId)) notFound();

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!course) notFound();

  return (
    <main className="max-w-[720px] mx-auto px-6 py-10">
      <Link
        href="/admin/courses"
        className="text-[12px] text-[#6b6560] hover:text-[#a88b2f]"
      >
        ← コース一覧
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-bold text-[#3a3632]">
        コースを編集
      </h1>
      <CourseEditor
        course={{
          id: course.id,
          name: course.name,
          description: course.description,
          category: course.category,
          durationMin: course.durationMin,
          price: course.price,
          memberPrice: course.memberPrice,
          tags: course.tags,
          imageUrl: course.imageUrl,
          sortOrder: course.sortOrder ?? 0,
          isActive: course.isActive ?? true,
        }}
      />
    </main>
  );
}
