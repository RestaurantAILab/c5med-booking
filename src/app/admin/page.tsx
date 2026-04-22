import Link from "next/link";
import { db } from "@/lib/db";
import { stores } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const allStores = await db.select().from(stores).orderBy(asc(stores.name));

  return (
    <main className="max-w-[1080px] mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#3a3632]">店舗管理</h1>
        <p className="text-[13px] text-[#6b6560] mt-1">
          営業時間・定休日・基本情報・コース紐付けを編集できます
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allStores.map((store) => {
          const closedDays = DAYS.filter(
            (d) => (store.businessHours[d.key] ?? []).length === 0
          );
          const hasHours = DAYS.some(
            (d) => (store.businessHours[d.key] ?? []).length > 0
          );
          return (
            <Link
              key={store.id}
              href={`/admin/stores/${store.id}`}
              className="block bg-white border border-[#e8e4df] rounded-xl p-5 hover:border-[#c8a84e] hover:shadow-[0_2px_8px_rgba(58,54,50,0.06)] transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-[15px] font-semibold text-[#3a3632]">
                  {store.name}
                </h2>
                {hasHours ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#e8f0e9] text-[#7d9e82] font-semibold">
                    公開中
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fef8ea] text-[#a88b2f] font-semibold">
                    未設定
                  </span>
                )}
              </div>
              {store.address && (
                <p className="text-[12px] text-[#6b6560] leading-relaxed mb-2">
                  {store.address}
                </p>
              )}
              <p className="text-[11px] text-[#9e9893]">
                {closedDays.length === 7
                  ? "営業時間未設定"
                  : closedDays.length > 0
                    ? `定休: ${closedDays.map((d) => d.label).join("・")}`
                    : "年中無休"}
              </p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}

const DAYS = [
  { key: "mon" as const, label: "月" },
  { key: "tue" as const, label: "火" },
  { key: "wed" as const, label: "水" },
  { key: "thu" as const, label: "木" },
  { key: "fri" as const, label: "金" },
  { key: "sat" as const, label: "土" },
  { key: "sun" as const, label: "日" },
];
