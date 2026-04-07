"use client";

type Slot = { start: string; end: string };

export function TimeSlots({
  slots,
  selectedSlot,
  onSelect,
  loading,
}: {
  slots: Slot[];
  selectedSlot: string | null;
  onSelect: (startTime: string) => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block w-6 h-6 border-2 border-[#c8a84e] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#9e9893] mt-2 text-sm">空き状況を確認中...</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[#9e9893]">
          この日は空きがありません。別の日をお選びください。
        </p>
      </div>
    );
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("ja-JP", {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div>
      <div className="mb-1 text-base font-semibold text-[#3a3632]">
        時間を選択
      </div>
      <p className="text-[13px] text-[#9e9893] mb-5">
        ご希望の時間帯をお選びください
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {slots.map((slot) => (
          <button
            key={slot.start}
            onClick={() => onSelect(slot.start)}
            className={`py-3 px-2 rounded-lg text-sm font-medium transition-all border ${
              selectedSlot === slot.start
                ? "bg-[#c8a84e] text-white border-[#c8a84e]"
                : "bg-[#faf9f7] text-[#3a3632] border-[#e8e4df] hover:border-[#e2cf8e] hover:bg-white"
            }`}
          >
            {formatTime(slot.start)}
          </button>
        ))}
      </div>
    </div>
  );
}
