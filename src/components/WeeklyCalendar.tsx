"use client";

import { useState, useEffect, useCallback } from "react";

type Slot = { start: string; end: string };
type WeekSlots = Record<string, Slot[]>;

const DOW_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getMonday(base: Date): Date {
  const d = new Date(base);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function WeeklyCalendar({
  storeId,
  courseId,
  businessHoursClosedDays,
  selectedSlot,
  onSelect,
}: {
  storeId: string;
  courseId: number;
  businessHoursClosedDays?: string[];
  selectedSlot: string | null;
  onSelect: (startTime: string) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [weekStart, setWeekStart] = useState(() => getMonday(today));
  const [weekSlots, setWeekSlots] = useState<WeekSlots>({});
  const [allSlots, setAllSlots] = useState<WeekSlots>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxDate = new Date(today);
  maxDate.setMonth(maxDate.getMonth() + 2);

  const canPrev = weekStart > today;
  const canNext = addDays(weekStart, 7) <= maxDate;

  const dates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dateStrs = dates.map(formatDateStr);

  const loadWeek = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/availability?storeId=${storeId}&weekStart=${formatDateStr(weekStart)}&courseId=${courseId}`
      );
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      const slots = data.slots as WeekSlots;
      setWeekSlots(slots);

      // Build allSlots (all possible time labels from the slots that exist)
      setAllSlots(slots);
    } catch {
      setError("空き状況の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [storeId, courseId, weekStart]);

  useEffect(() => {
    loadWeek();
  }, [loadWeek]);

  // Collect all unique time labels across the week
  const allTimeLabels: string[] = [];
  const timeSet = new Set<string>();
  for (const dateStr of dateStrs) {
    const slots = allSlots[dateStr] ?? [];
    for (const slot of slots) {
      const t = formatTime(slot.start);
      if (!timeSet.has(t)) {
        timeSet.add(t);
        allTimeLabels.push(t);
      }
    }
  }
  allTimeLabels.sort();

  // Build lookup: available slot start times per date
  const availableMap = new Map<string, Set<string>>();
  const slotMap = new Map<string, string>(); // "date|time" -> ISO start
  for (const dateStr of dateStrs) {
    const available = new Set<string>();
    for (const slot of weekSlots[dateStr] ?? []) {
      const t = formatTime(slot.start);
      available.add(t);
      slotMap.set(`${dateStr}|${t}`, slot.start);
    }
    availableMap.set(dateStr, available);
  }

  // All slots (including busy) for detecting closed days vs busy
  const allSlotsMap = new Map<string, Set<string>>();
  for (const dateStr of dateStrs) {
    const all = new Set<string>();
    for (const slot of allSlots[dateStr] ?? []) {
      all.add(formatTime(slot.start));
    }
    allSlotsMap.set(dateStr, all);
  }

  const nowMs = Date.now();

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-6 h-6 border-2 border-[#c8a84e] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#9e9893] mt-3 text-sm">空き状況を確認中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 text-sm mb-3">{error}</p>
        <button
          onClick={loadWeek}
          className="text-sm text-[#c8a84e] hover:text-[#a88b2f] underline"
        >
          再試行
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1 text-base font-semibold text-[#3a3632]">
        日時を選択
      </div>
      <p className="text-[13px] text-[#9e9893] mb-4">
        ご希望の日時をタップしてください
      </p>

      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setWeekStart(addDays(weekStart, -7))}
          disabled={!canPrev}
          className="w-8 h-8 rounded-full border border-[#e8e4df] flex items-center justify-center text-[#6b6560] hover:bg-[#f5f0eb] hover:border-[#e2cf8e] disabled:opacity-30 disabled:hover:bg-transparent transition-all"
        >
          ←
        </button>
        <span className="text-[14px] font-semibold text-[#3a3632]">
          {dates[0].getMonth() + 1}月{dates[0].getDate()}日 〜{" "}
          {dates[6].getMonth() + 1}月{dates[6].getDate()}日
        </span>
        <button
          onClick={() => setWeekStart(addDays(weekStart, 7))}
          disabled={!canNext}
          className="w-8 h-8 rounded-full border border-[#e8e4df] flex items-center justify-center text-[#6b6560] hover:bg-[#f5f0eb] hover:border-[#e2cf8e] disabled:opacity-30 disabled:hover:bg-transparent transition-all"
        >
          →
        </button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto -mx-2 px-2 pb-2">
        <div className="min-w-[520px]">
          {/* Day headers */}
          <div className="grid grid-cols-[48px_repeat(7,1fr)] gap-px mb-px">
            <div /> {/* empty corner */}
            {dates.map((d, i) => {
              const isToday = formatDateStr(d) === formatDateStr(today);
              const isClosed =
                (allSlots[dateStrs[i]] ?? []).length === 0 &&
                !loading;
              const dow = (i + 1) % 7; // 0=Sun in display, but our array is Mon-Sun

              return (
                <div
                  key={dateStrs[i]}
                  className={`text-center py-2 ${isClosed ? "bg-[#f5f2ed]" : ""}`}
                >
                  <div
                    className={`text-[11px] font-medium ${
                      dow === 6
                        ? "text-[#c66]"
                        : dow === 5
                          ? "text-[#668ebc]"
                          : "text-[#9e9893]"
                    }`}
                  >
                    {DOW_LABELS[i]}
                  </div>
                  <div
                    className={`text-[13px] font-semibold mt-0.5 ${
                      isToday
                        ? "text-[#a88b2f]"
                        : "text-[#3a3632]"
                    }`}
                  >
                    {d.getMonth() + 1}/{d.getDate()}
                  </div>
                  {isToday && (
                    <div className="mx-auto mt-1 w-5 h-0.5 rounded-full bg-[#c8a84e]" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Time rows */}
          {allTimeLabels.length === 0 ? (
            <div className="text-center py-8 text-[#9e9893] text-sm">
              この週は空きがありません
            </div>
          ) : (
            <div className="border border-[#e8e4df] rounded-lg overflow-hidden">
              {allTimeLabels.map((time, rowIdx) => (
                <div
                  key={time}
                  className={`grid grid-cols-[48px_repeat(7,1fr)] gap-px ${
                    rowIdx > 0 ? "border-t border-[#f0ece7]" : ""
                  }`}
                >
                  {/* Time label */}
                  <div className="flex items-center justify-end pr-2 text-[11px] text-[#6b6560] bg-white">
                    {time}
                  </div>

                  {/* Day cells */}
                  {dateStrs.map((dateStr, colIdx) => {
                    const isClosed =
                      (allSlots[dateStr] ?? []).length === 0;
                    const hasSlot =
                      allSlotsMap.get(dateStr)?.has(time) ?? false;
                    const isAvailable =
                      availableMap.get(dateStr)?.has(time) ?? false;
                    const slotIso = slotMap.get(`${dateStr}|${time}`);
                    const isPast =
                      slotIso ? new Date(slotIso).getTime() < nowMs : false;
                    const isSelected = slotIso === selectedSlot;

                    if (isClosed) {
                      return (
                        <div
                          key={`${dateStr}-${time}`}
                          className="bg-[#f5f2ed] flex items-center justify-center min-h-[36px]"
                        >
                          {rowIdx === Math.floor(allTimeLabels.length / 2) && (
                            <span className="text-[10px] text-[#c4bfb8] rotate-0">
                              定休日
                            </span>
                          )}
                        </div>
                      );
                    }

                    if (!hasSlot) {
                      return (
                        <div
                          key={`${dateStr}-${time}`}
                          className="bg-[#faf9f7] min-h-[36px]"
                        />
                      );
                    }

                    if (isPast || !isAvailable) {
                      return (
                        <div
                          key={`${dateStr}-${time}`}
                          className="bg-[#f0ece7] flex items-center justify-center min-h-[36px] cursor-not-allowed"
                        >
                          <span className="text-[10px] text-[#c4bfb8]">×</span>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={`${dateStr}-${time}`}
                        onClick={() => slotIso && onSelect(slotIso)}
                        className={`min-h-[36px] transition-all text-[11px] font-medium ${
                          isSelected
                            ? "bg-[#c8a84e] text-white"
                            : "bg-[#faf9f7] text-[#6b6560] hover:bg-white hover:border-[#c8a84e] border border-transparent hover:border"
                        }`}
                      >
                        {isSelected ? "●" : "○"}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
