import Link from "next/link";
import Image from "next/image";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function CourseListPage() {
  const allCourses = await db
    .select()
    .from(courses)
    .orderBy(asc(courses.sortOrder), asc(courses.id));

  return (
    <main className="max-w-[1080px] mx-auto px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#3a3632]">コース管理</h1>
          <p className="text-[13px] text-[#6b6560] mt-1">
            {allCourses.length}件のコースが登録されています
          </p>
        </div>
        <Link
          href="/admin/courses/new"
          className="px-4 py-2 bg-[#c8a84e] hover:bg-[#a88b2f] text-white text-[13px] font-semibold rounded-lg shadow-[0_2px_8px_rgba(200,168,78,0.3)]"
        >
          + 新規作成
        </Link>
      </div>

      <div className="bg-white border border-[#e8e4df] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#faf9f7] text-[11px] text-[#6b6560] uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3 w-20">画像</th>
              <th className="text-left px-4 py-3">コース名</th>
              <th className="text-left px-4 py-3 w-32">カテゴリ</th>
              <th className="text-right px-4 py-3 w-20">所要</th>
              <th className="text-right px-4 py-3 w-28">価格</th>
              <th className="text-right px-4 py-3 w-20">状態</th>
              <th className="px-4 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {allCourses.map((c) => (
              <tr
                key={c.id}
                className="border-t border-[#f0ece7] hover:bg-[#faf9f7]"
              >
                <td className="px-4 py-3">
                  {c.imageUrl ? (
                    <div className="relative w-12 h-12 rounded overflow-hidden bg-[#f0ece7]">
                      <Image
                        src={c.imageUrl}
                        alt={c.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded bg-[#f0ece7] flex items-center justify-center text-[#c8a84e] text-[10px]">
                      No img
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-[13px] text-[#3a3632] font-medium">
                  {c.name}
                </td>
                <td className="px-4 py-3 text-[12px] text-[#6b6560]">
                  {c.category}
                </td>
                <td className="px-4 py-3 text-right text-[12px] text-[#6b6560]">
                  {c.durationMin}分
                </td>
                <td className="px-4 py-3 text-right text-[13px] text-[#3a3632] font-semibold">
                  ¥{c.price.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      c.isActive
                        ? "bg-[#e8f0e9] text-[#7d9e82]"
                        : "bg-[#f5f0eb] text-[#9e9893]"
                    }`}
                  >
                    {c.isActive ? "公開中" : "非公開"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/courses/${c.id}`}
                    className="text-[12px] text-[#a88b2f] hover:underline"
                  >
                    編集
                  </Link>
                </td>
              </tr>
            ))}
            {allCourses.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-[13px] text-[#9e9893]"
                >
                  コースがありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
