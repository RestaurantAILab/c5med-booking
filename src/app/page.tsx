import Link from "next/link";

const STORES = [
  { id: "shin-kobe", name: "新神戸店", area: "兵庫" },
  { id: "sapporo-nishi11", name: "札幌西11丁目店", area: "北海道" },
  { id: "sapporo-kita2", name: "札幌北2条店", area: "北海道" },
  { id: "nagoya-hilton", name: "名古屋ヒルトン店", area: "愛知" },
  { id: "kyoto", name: "京都店", area: "京都" },
  { id: "shimbashi", name: "新橋店", area: "東京" },
  { id: "fukuoka-c5clinic", name: "福岡 C5クリニック内", area: "福岡" },
];

export default function Home() {
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
        <div className="grid gap-4 sm:grid-cols-2">
          {STORES.map((store) => (
            <Link
              key={store.id}
              href={`/stores/${store.id}`}
              className="block p-6 bg-white rounded-xl border border-[#e8e4df] hover:border-[#e2cf8e] hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#c8a84e] font-semibold">
                    {store.area}
                  </span>
                  <h3 className="text-[#3a3632] font-bold text-lg mt-1 group-hover:text-[#a88b2f] transition-colors">
                    {store.name}
                  </h3>
                </div>
                <span className="text-[#e8e4df] group-hover:text-[#c8a84e] transition-colors">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
