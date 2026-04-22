import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { stores } from "@/lib/db/schema";

// force-dynamic: admin 側の店舗変更を即反映させたい & Neon HTTP は build時に届かないことがある
export const dynamic = "force-dynamic";

export default async function Home() {
  let storeList: { id: string; name: string }[] = [];
  try {
    storeList = await db
      .select({ id: stores.id, name: stores.name })
      .from(stores)
      .where(eq(stores.isActive, true))
      .orderBy(asc(stores.id));
  } catch (err) {
    console.error("Failed to load stores:", err);
  }

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#f5f0eb] via-[#faf9f7] to-[#f0f5f1] py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-[family-name:var(--font-cormorant)] text-[#a88b2f] mb-4 tracking-wide">
            C5med Beauty
          </h1>
          <p className="text-[#c8a84e] text-lg mb-2 font-medium">
            メディカルエステ
          </p>
          <p className="text-[#6b6560] max-w-xl mx-auto">
            ヒト幹細胞上清液を使用した最先端のメディカルエステ。
            医療提携のもと、安心・安全な施術をご提供します。
          </p>
        </div>
      </section>

      {/* Store list */}
      <section className="max-w-3xl mx-auto py-16 px-4">
        <h2 className="text-2xl font-bold text-[#3a3632] mb-8 text-center">
          店舗一覧
        </h2>
        {storeList.length === 0 ? (
          <p className="text-center text-[#9e9893] text-sm">
            現在ご予約いただける店舗がありません。しばらくしてから再度お越しください。
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {storeList.map((store) => (
              <Link
                key={store.id}
                href={`/stores/${store.id}`}
                className="block p-6 bg-white rounded-xl border border-[#e8e4df] hover:border-[#e2cf8e] hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-[#3a3632] font-bold text-lg group-hover:text-[#a88b2f] transition-colors">
                    {store.name}
                  </h3>
                  <span className="text-[#e8e4df] group-hover:text-[#c8a84e] transition-colors">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
