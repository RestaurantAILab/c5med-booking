import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { stores } from "@/lib/db/schema";
import type { BusinessHours } from "@/lib/db/schema";
import { BookingWidget } from "@/components/BookingWidget";
import { FAQ } from "@/components/FAQ";

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

const FAQ_ITEMS = [
  {
    question: "痛みはありますか？",
    answer:
      "針を使わない施術のため、痛みはほとんどありません。施術後すぐにメイクも可能です。",
  },
  {
    question: "1回の施術でどのくらい効果がありますか？",
    answer:
      "個人差はありますが、1回目から実感される方が多いです。回数を重ねることでさらに効果が持続します。",
  },
  {
    question: "幹細胞上清液とは何ですか？",
    answer:
      "ヒト由来の幹細胞を培養した際に得られる上澄み液です。成長因子やサイトカインなどの有効成分が豊富に含まれています。",
  },
  {
    question: "敏感肌でも大丈夫ですか？",
    answer:
      "はい、お肌に負担の少ない施術です。カウンセリングでお肌の状態を確認した上で施術いたします。",
  },
  {
    question: "予約のキャンセルはできますか？",
    answer:
      "はい、お電話またはLINEにてキャンセルを承ります。",
  },
];

const DOW_LABELS: Record<string, string> = {
  mon: "月",
  tue: "火",
  wed: "水",
  thu: "木",
  fri: "金",
  sat: "土",
  sun: "日",
};

function getClosedDays(bh: BusinessHours): string[] {
  const closed: string[] = [];
  for (const [key, label] of Object.entries(DOW_LABELS)) {
    const ranges = bh[key as keyof Omit<BusinessHours, "slot_interval_min">];
    if (Array.isArray(ranges) && ranges.length === 0) {
      closed.push(label);
    }
  }
  return closed;
}

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
    title: store
      ? `${store.name} | C5med Beauty メディカルエステ`
      : "C5med Beauty",
    description: `C5med Beauty ${store?.name ?? ""} — 幹細胞培養上清液使用のメディカルエステ。看護師在籍・医療提携サロン。`,
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
    store = {
      id: fallback.id,
      name: fallback.name,
      address: null,
      businessHours: null,
    };
  }

  if (!store) notFound();

  const closedDays = store.businessHours
    ? getClosedDays(store.businessHours)
    : [];

  return (
    <main className="flex-1">
      {/* ===== HEADER ===== */}
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

      {/* ===== 1. HERO ===== */}
      <section className="bg-gradient-to-br from-[#f5f0eb] via-[#faf9f7] to-[#f0f5f1] py-20 sm:py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute -top-[120px] -right-[60px] w-[300px] h-[300px] rounded-full bg-[rgba(125,158,130,0.06)]" />
        <div className="absolute -bottom-[80px] -left-[40px] w-[200px] h-[200px] rounded-full bg-[rgba(181,145,123,0.06)]" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 bg-[#e8f0e9] text-[#7d9e82] text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide">
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

          <h1 className="text-[clamp(24px,5vw,36px)] font-bold text-[#3a3632] leading-tight mb-3">
            再生のチカラで、
            <br className="sm:hidden" />
            理想の健康美肌へ
          </h1>
          <p className="text-[15px] text-[#6b6560] mb-2">
            幹細胞培養上清液使用のメディカルエステ
          </p>
          <p className="font-[family-name:var(--font-cormorant)] text-[clamp(28px,5vw,40px)] font-normal text-[#a88b2f] tracking-wider mb-1">
            C5med Beauty
          </p>
          <p className="text-base font-medium text-[#3a3632] mb-1">
            {store.name}
          </p>
          {store.address && (
            <p className="text-[13px] text-[#9e9893] mb-8">{store.address}</p>
          )}

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
      </section>

      {/* ===== 2. 美しさへの思い ===== */}
      <section className="py-20 px-6">
        <div className="max-w-[680px] mx-auto text-center">
          <p className="text-[11px] font-semibold text-[#c8a84e] tracking-[0.2em] uppercase mb-3">
            Our Philosophy
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-[#3a3632] mb-6">
            美しさへの思い
          </h2>
          <div className="w-8 h-px bg-[#c8a84e] mx-auto mb-8" />
          <p className="text-[14px] sm:text-[15px] text-[#6b6560] leading-[1.9] mb-5">
            話題の幹細胞培養上清液の力を最大限に引き出す最新技術を導入。
            お肌に優しい施術、そして内側から育てていく本当の美しさを目指していきます。
          </p>
          <p className="text-[14px] sm:text-[15px] text-[#6b6560] leading-[1.9]">
            従来の保湿、抗酸化などではなく幹細胞上清液の成長因子のチカラで内側から生き生きとしたお肌、代謝の高いお身体をつくっていきます。
          </p>
        </div>
      </section>

      {/* ===== 3. 3つの特徴 ===== */}
      <section className="bg-[#faf9f7] py-20 px-6">
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] font-semibold text-[#c8a84e] tracking-[0.2em] uppercase mb-3">
              Features
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-[#3a3632]">
              3つの特徴
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white border border-[#f0ece7] rounded-xl p-7 shadow-[0_1px_3px_rgba(58,54,50,0.06)] hover:shadow-[0_4px_12px_rgba(58,54,50,0.08)] hover:-translate-y-0.5 transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#e8f0e9] flex items-center justify-center text-xl mb-5">
                🧬
              </div>
              <h3 className="font-bold text-[15px] text-[#3a3632] mb-3">
                自社製造の幹細胞培養上清液
              </h3>
              <p className="text-[13px] text-[#6b6560] leading-relaxed">
                ヒト由来の幹細胞培養施設を保有。医療点滴で使用している濃度で冷凍にて出荷。施術直前に解凍して使用することで上清液の成分を安全に効果的に届けることが可能。
              </p>
            </div>
            <div className="bg-white border border-[#f0ece7] rounded-xl p-7 shadow-[0_1px_3px_rgba(58,54,50,0.06)] hover:shadow-[0_4px_12px_rgba(58,54,50,0.08)] hover:-translate-y-0.5 transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#fef8ea] flex items-center justify-center text-xl mb-5">
                💉
              </div>
              <h3 className="font-bold text-[15px] text-[#3a3632] mb-3">
                針ナシ注射による高速導入
              </h3>
              <p className="text-[13px] text-[#6b6560] leading-relaxed">
                水光注射の原理を針を刺すことなく実現。お肌の表面ではなく深部組織まで美容成分を届ける。痛みが少なく、ダウンタイムほぼゼロ。施術後すぐにメイクや外出も可能。
              </p>
            </div>
            <div className="bg-white border border-[#f0ece7] rounded-xl p-7 shadow-[0_1px_3px_rgba(58,54,50,0.06)] hover:shadow-[0_4px_12px_rgba(58,54,50,0.08)] hover:-translate-y-0.5 transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#eef2fa] flex items-center justify-center text-xl mb-5">
                ✨
              </div>
              <h3 className="font-bold text-[15px] text-[#3a3632] mb-3">
                近赤外線×音響振動テクノロジー
              </h3>
              <p className="text-[13px] text-[#6b6560] leading-relaxed">
                高輝度近赤外LEDと音響振動で血管拡張・血流促進。美容成分の浸透をサポート。レーザーのような熱刺激がなく安全で快適。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 4. 施術のながれ ===== */}
      <section className="py-20 px-6">
        <div className="max-w-[680px] mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] font-semibold text-[#c8a84e] tracking-[0.2em] uppercase mb-3">
              Flow
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-[#3a3632]">
              施術のながれ
            </h2>
          </div>

          <div className="space-y-0">
            {[
              {
                num: "01",
                title: "カウンセリング",
                desc: "お悩みやご要望を丁寧にヒアリング。お肌の状態を看護師が専門的に確認します。",
              },
              {
                num: "02",
                title: "施術プラン提案",
                desc: "お肌の状態に合わせたオーダーメイドの施術プランをご提案いたします。",
              },
              {
                num: "03",
                title: "施術",
                desc: "針ナシ注射 + 近赤外線で痛みなく施術。ダウンタイムほぼゼロで当日メイクOK。",
              },
              {
                num: "04",
                title: "アフターケア",
                desc: "施術後の経過確認とホームケアアドバイス。継続プランのご相談も承ります。",
              },
            ].map((step, i, arr) => (
              <div key={step.num} className="flex gap-5">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#c8a84e] text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {step.num}
                  </div>
                  {i < arr.length - 1 && (
                    <div className="w-px flex-1 bg-[#e8e4df] my-1" />
                  )}
                </div>
                {/* Content */}
                <div className={`pb-8 ${i === arr.length - 1 ? "pb-0" : ""}`}>
                  <h3 className="font-bold text-[15px] text-[#3a3632] mb-1">
                    {step.title}
                  </h3>
                  <p className="text-[13px] text-[#6b6560] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 5. キャンペーン ===== */}
      <section className="bg-gradient-to-br from-[#faf9f7] to-[#f5f0eb] py-20 px-6">
        <div className="max-w-[800px] mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] font-semibold text-[#c8a84e] tracking-[0.2em] uppercase mb-3">
              Campaign
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-[#3a3632]">
              お得なキャンペーン
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Campaign 1 */}
            <div className="bg-white rounded-xl border border-[#e8e4df] p-6 shadow-[0_2px_8px_rgba(58,54,50,0.06)] relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#c8a84e] text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                50% OFF
              </div>
              <p className="text-[11px] font-semibold text-[#c8a84e] tracking-wider uppercase mb-2">
                Facial
              </p>
              <h3 className="font-bold text-[#3a3632] mb-3">
                トータルフェイシャルケア
              </h3>
              <div className="flex items-baseline gap-3">
                <span className="text-[#9e9893] line-through text-sm">
                  ¥35,200
                </span>
                <span className="text-2xl font-bold text-red-500">
                  ¥17,600
                </span>
                <span className="text-xs text-[#9e9893]">（税込）</span>
              </div>
            </div>

            {/* Campaign 2 */}
            <div className="bg-white rounded-xl border border-[#e8e4df] p-6 shadow-[0_2px_8px_rgba(58,54,50,0.06)] relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#c8a84e] text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                50% OFF
              </div>
              <p className="text-[11px] font-semibold text-[#c8a84e] tracking-wider uppercase mb-2">
                Body
              </p>
              <h3 className="font-bold text-[#3a3632] mb-3">
                ぽっこりお腹集中コース
              </h3>
              <div className="flex items-baseline gap-3">
                <span className="text-[#9e9893] line-through text-sm">
                  ¥39,600
                </span>
                <span className="text-2xl font-bold text-red-500">
                  ¥19,800
                </span>
                <span className="text-xs text-[#9e9893]">（税込）</span>
              </div>
            </div>

            {/* Campaign 3 */}
            <div className="bg-white rounded-xl border border-[#e8e4df] p-6 shadow-[0_2px_8px_rgba(58,54,50,0.06)]">
              <p className="text-[11px] font-semibold text-[#c8a84e] tracking-wider uppercase mb-2">
                Trial
              </p>
              <h3 className="font-bold text-[#3a3632] mb-3">
                リフトアップ、小顔体験
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#a88b2f]">
                  ¥4,980
                </span>
                <span className="text-xs text-[#9e9893]">（税込）</span>
              </div>
            </div>

            {/* Campaign 4 */}
            <div className="bg-white rounded-xl border border-[#e8e4df] p-6 shadow-[0_2px_8px_rgba(58,54,50,0.06)]">
              <p className="text-[11px] font-semibold text-[#c8a84e] tracking-wider uppercase mb-2">
                Trial
              </p>
              <h3 className="font-bold text-[#3a3632] mb-3">
                気になる部分の痩身体験
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#a88b2f]">
                  ¥4,980
                </span>
                <span className="text-xs text-[#9e9893]">（税込）</span>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <a
              href="#booking"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#c8a84e] hover:bg-[#a88b2f] text-white font-semibold rounded-full shadow-[0_4px_16px_rgba(200,168,78,0.3)] transition-all text-sm tracking-wide"
            >
              キャンペーン価格で予約する →
            </a>
          </div>
        </div>
      </section>

      {/* ===== 6. 予約 ===== */}
      <section id="booking" className="py-20 px-6">
        <div className="max-w-[520px] mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] font-semibold text-[#c8a84e] tracking-[0.2em] uppercase mb-3">
              Reservation
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-[#3a3632]">
              ご予約
            </h2>
          </div>
          <BookingWidget storeId={store.id} storeName={store.name} />
        </div>
      </section>

      {/* ===== 7. FAQ ===== */}
      <section className="bg-[#faf9f7] py-20 px-6">
        <div className="max-w-[680px] mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] font-semibold text-[#c8a84e] tracking-[0.2em] uppercase mb-3">
              FAQ
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-[#3a3632]">
              よくある質問
            </h2>
          </div>
          <FAQ items={FAQ_ITEMS} />
        </div>
      </section>

      {/* ===== 8. 店舗情報 ===== */}
      <section className="py-20 px-6">
        <div className="max-w-[680px] mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] font-semibold text-[#c8a84e] tracking-[0.2em] uppercase mb-3">
              Salon Info
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-[#3a3632]">
              店舗情報
            </h2>
          </div>

          <div className="bg-white border border-[#e8e4df] rounded-xl p-6 sm:p-8 shadow-[0_1px_3px_rgba(58,54,50,0.06)]">
            <table className="w-full text-left">
              <tbody>
                <tr className="border-b border-[#f0ece7]">
                  <td className="py-3 text-[13px] text-[#9e9893] w-24 align-top">
                    店舗名
                  </td>
                  <td className="py-3 text-[14px] font-medium text-[#3a3632]">
                    C5med Beauty {store.name}
                  </td>
                </tr>
                {store.address && (
                  <tr className="border-b border-[#f0ece7]">
                    <td className="py-3 text-[13px] text-[#9e9893] align-top">
                      住所
                    </td>
                    <td className="py-3 text-[14px] text-[#3a3632]">
                      {store.address}
                    </td>
                  </tr>
                )}
                <tr className="border-b border-[#f0ece7]">
                  <td className="py-3 text-[13px] text-[#9e9893] align-top">
                    営業時間
                  </td>
                  <td className="py-3 text-[14px] text-[#3a3632]">
                    10:00〜19:00
                  </td>
                </tr>
                {closedDays.length > 0 && (
                  <tr>
                    <td className="py-3 text-[13px] text-[#9e9893] align-top">
                      定休日
                    </td>
                    <td className="py-3 text-[14px] text-[#3a3632]">
                      毎週{closedDays.join("・")}曜日
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Other stores */}
          <div className="mt-12 text-center">
            <h3 className="text-sm font-semibold text-[#6b6560] mb-4">
              他の店舗を見る
            </h3>
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
          </div>
        </div>
      </section>

      {/* ===== 9. FOOTER ===== */}
      <footer className="border-t border-[#f0ece7] py-10 text-center">
        <p className="font-[family-name:var(--font-cormorant)] text-lg text-[#c8a84e] mb-1">
          C5med Beauty
        </p>
        <p className="text-[11px] text-[#9e9893] mb-1">
          運営: MKメディカル合同会社
        </p>
        <p className="text-[11px] text-[#9e9893]">
          &copy; 2026 C5med Beauty. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
