import Link from "next/link";
import { CourseEditor } from "../CourseEditor";

export const dynamic = "force-dynamic";

export default function NewCoursePage() {
  return (
    <main className="max-w-[720px] mx-auto px-6 py-10">
      <Link
        href="/admin/courses"
        className="text-[12px] text-[#6b6560] hover:text-[#a88b2f]"
      >
        ← コース一覧
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-bold text-[#3a3632]">
        コースを新規作成
      </h1>
      <CourseEditor />
    </main>
  );
}
