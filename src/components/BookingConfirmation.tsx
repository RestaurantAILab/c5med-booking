"use client";

export function BookingConfirmation({
  storeName,
  courseName,
  price,
  bookedAt,
  customerName,
}: {
  storeName: string;
  courseName: string;
  price: number;
  bookedAt: string;
  customerName: string;
}) {
  const formatted = new Date(bookedAt).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="text-center py-5">
      <div className="w-14 h-14 mx-auto bg-[#e8f0e9] rounded-full flex items-center justify-center mb-5">
        <svg
          className="w-6 h-6 text-[#7d9e82]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-[#3a3632] mb-2">
        ご予約ありがとうございます
      </h3>
      <p className="text-[13px] text-[#6b6560] mb-5">
        確認メールをお送りしました。
      </p>

      <table className="w-full text-left border-collapse">
        <tbody>
          <tr className="border-b border-[#f0ece7]">
            <td className="py-2.5 text-[13px] text-[#9e9893] w-[100px]">
              お名前
            </td>
            <td className="py-2.5 text-sm font-medium text-[#3a3632]">
              {customerName} 様
            </td>
          </tr>
          <tr className="border-b border-[#f0ece7]">
            <td className="py-2.5 text-[13px] text-[#9e9893]">店舗</td>
            <td className="py-2.5 text-sm font-medium text-[#3a3632]">
              {storeName}
            </td>
          </tr>
          <tr className="border-b border-[#f0ece7]">
            <td className="py-2.5 text-[13px] text-[#9e9893]">コース</td>
            <td className="py-2.5 text-sm font-medium text-[#3a3632]">
              {courseName}
            </td>
          </tr>
          <tr className="border-b border-[#f0ece7]">
            <td className="py-2.5 text-[13px] text-[#9e9893]">日時</td>
            <td className="py-2.5 text-sm font-medium text-[#3a3632]">
              {formatted}
            </td>
          </tr>
          <tr>
            <td className="py-2.5 text-[13px] text-[#9e9893]">料金</td>
            <td className="py-2.5 text-sm font-bold text-[#a88b2f]">
              ¥{price.toLocaleString()}（税込）
            </td>
          </tr>
        </tbody>
      </table>

      <p className="text-xs text-[#9e9893] mt-6">
        キャンセル・変更をご希望の場合は、店舗へ直接ご連絡ください。
      </p>
    </div>
  );
}
