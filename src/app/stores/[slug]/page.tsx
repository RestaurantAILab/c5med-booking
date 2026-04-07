import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { stores } from "@/lib/db/schema";
import { BookingWidget } from "@/components/BookingWidget";

export const revalidate = 3600;

const ALL_STORES = [
  { id: "shin-kobe", name: "新神戸店" },
  { id: "sapporo-nishi11", name: "札幌西11丁目店" },
  { id: "sapporo-kita2", name: "札幌北2条店" },
  { id: "nagoya-hilton", name: "名古屋ヒルトン店" },
  { id: "kyoto", name: "京都店" },
  { id: "shimbashi", name: "新橋店" },
  { id: "fukuoka-c5clinic", name: "福岡 C5クリニック内" },
];

export async function generateStaticParams() {
  return ALL_STORES.map((s) => ({ slug: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = ALL_STORES.find((s) => s.id === slug);
  return {
    title: store ? `${store.name} | C5med Beauty` : "C5med Beauty",
    description: `C5med Beauty ${store?.name ?? ""}のご予約ページ`,
  };
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let store;
  try {
    const [result] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, slug))
      .limit(1);
    store = result;
  } catch {
    const fallback = ALL_STORES.find((s) => s.id === slug);
    if (!fallback) notFound();
    store = { id: fallback.id, name: fallback.name, address: null };
  }

  if (!store) notFound();

  return (
    <main className="flex-1">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/92 backdrop-blur-md border-b border-[#f0ece7]">
        <div className="max-w-[1080px] mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link
            href="/"
            className="font-[family-name:var(--font-cormorant)] text-[22px] font-medium text-[#a88b2f] tracking-wide"
          >
            C5med Beauty
          </Link>
          <span className="text-[13px] text-[#6b6560] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7d9e82] inline-block" />
            {store.name}
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#f5f0eb] via-[#faf9f7] to-[#f0f5f1] py-16 px-6 text-center relative overflow-hidden">
        <div className="absolute -top-[120px] -right-[60px] w-[300px] h-[300px] rounded-full bg-[rgba(125,158,130,0.06)]" />
        <div className="absolute -bottom-[80px] -left-[40px] w-[200px] h-[200px] rounded-full bg-[rgba(181,145,123,0.06)]" />
        <div className="relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-[#e8f0e9] text-[#7d9e82] text-xs font-semibold px-4 py-1.5 rounded-full mb-5 tracking-wide">
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2L15 8.5L22 9.5L17 14.5L18 21.5L12 18.5L6 21.5L7 14.5L2 9.5L9 8.5Z" />
            </svg>
            看護師在籍・医療提携サロン
          </div>

          <h1 className="font-[family-name:var(--font-cormorant)] text-[clamp(32px,6vw,48px)] font-normal text-[#a88b2f] tracking-wider mb-2">
            C5med Beauty
          </h1>
          <p className="text-lg font-medium text-[#3a3632] mb-2">
            {store.name}
          </p>
          {store.address && (
            <p className="text-[13px] text-[#9e9893] mb-8">{store.address}</p>
          )}

          {/* Trust strip */}
          <div className="flex justify-center gap-8 flex-wrap mb-9">
            <div className="flex items-center gap-2 text-[13px] text-[#6b6560]">
              <span className="w-7 h-7 rounded-full bg-[#e8f0e9] text-[#7d9e82] flex items-center justify-center text-sm">
                🧬
              </span>
              自社培養ヒト幹細胞上清液
            </div>
            <div className="flex items-center gap-2 text-[13px] text-[#6b6560]">
              <span className="w-7 h-7 rounded-full bg-[#fef8ea] text-[#c8a84e] flex items-center justify-center text-sm">
                ✦
              </span>
              ノンニードル施術
            </div>
            <div className="flex items-center gap-2 text-[13px] text-[#6b6560]">
              <span className="w-7 h-7 rounded-full bg-[#e8f0e9] text-[#7d9e82] flex items-center justify-center text-sm">
                ⚕
              </span>
              医療機関提携
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-[900px] mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-[#f0ece7] rounded-xl p-7 shadow-[0_1px_3px_rgba(58,54,50,0.06)] hover:shadow-[0_4px_12px_rgba(58,54,50,0.08)] hover:-translate-y-0.5 transition-all">
          <div className="w-11 h-11 rounded-[10px] bg-[#e8f0e9] flex items-center justify-center text-xl mb-4">
            🧬
          </div>
          <div className="font-semibold text-[15px] text-[#3a3632] mb-1.5">
            高濃度ヒト幹細胞上清液
          </div>
          <p className="text-[13px] text-[#6b6560] leading-relaxed">
            自社で培養した天然の高濃度ヒト幹細胞培養上清液を使用。シミ・シワ・たるみ・ニキビなど、あらゆる肌悩みに対応します。
          </p>
        </div>
        <div className="bg-white border border-[#f0ece7] rounded-xl p-7 shadow-[0_1px_3px_rgba(58,54,50,0.06)] hover:shadow-[0_4px_12px_rgba(58,54,50,0.08)] hover:-translate-y-0.5 transition-all">
          <div className="w-11 h-11 rounded-[10px] bg-[#fef8ea] flex items-center justify-center text-xl mb-4">
            ✨
          </div>
          <div className="font-semibold text-[15px] text-[#3a3632] mb-1.5">
            ノンニードル施術
          </div>
          <p className="text-[13px] text-[#6b6560] leading-relaxed">
            近赤外線と音響振動を融合した最新技術で、針を使わず皮下まで美容成分を浸透。痛みはほぼなく、当日お化粧も可能です。
          </p>
        </div>
        <div className="bg-white border border-[#f0ece7] rounded-xl p-7 shadow-[0_1px_3px_rgba(58,54,50,0.06)] hover:shadow-[0_4px_12px_rgba(58,54,50,0.08)] hover:-translate-y-0.5 transition-all">
          <div className="w-11 h-11 rounded-[10px] bg-[#eef2fa] flex items-center justify-center text-xl mb-4">
            🏥
          </div>
          <div className="font-semibold text-[15px] text-[#3a3632] mb-1.5">
            医療機関との連携
          </div>
          <p className="text-[13px] text-[#6b6560] leading-relaxed">
            看護師が在籍し、医療機関と提携した安心のエステティック。お肌の状態を専門的に見極めた上で施術いたします。
          </p>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center px-6 pb-12">
        <a
          href="#booking"
          className="inline-flex items-center gap-2 px-10 py-4 bg-[#c8a84e] hover:bg-[#a88b2f] text-white font-semibold rounded-full shadow-[0_4px_16px_rgba(200,168,78,0.3)] hover:shadow-[0_6px_20px_rgba(200,168,78,0.4)] hover:-translate-y-0.5 transition-all text-base tracking-wide"
        >
          ご予約はこちら →
        </a>
        <p className="text-xs text-[#9e9893] mt-2.5">
          空き状況をリアルタイムで確認できます
        </p>
      </div>

      {/* Booking widget */}
      <section id="booking" className="max-w-[520px] mx-auto px-6 pb-16">
        <BookingWidget storeId={store.id} storeName={store.name} />
      </section>

      {/* Other stores */}
      <section className="max-w-[720px] mx-auto py-12 px-6 text-center">
        <h2 className="text-sm font-semibold text-[#6b6560] mb-4">
          全国7店舗
        </h2>
        <div className="flex flex-wrap justify-center gap-2">
          {ALL_STORES.map((s) => (
            <Link
              key={s.id}
              href={`/stores/${s.id}`}
              className={`px-[18px] py-2 border rounded-full text-[13px] transition-all ${
                s.id === slug
                  ? "border-[#c8a84e] text-[#a88b2f] font-semibold bg-white"
                  : "border-[#e8e4df] text-[#6b6560] bg-white hover:border-[#e2cf8e] hover:text-[#a88b2f]"
              }`}
            >
              {s.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#f0ece7] py-8 text-center">
        <p className="font-[family-name:var(--font-cormorant)] text-lg text-[#c8a84e] mb-2">
          C5med Beauty
        </p>
        <p className="text-xs text-[#9e9893]">
          &copy; 2026 C5med Beauty. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
