"use client";

import { useState } from "react";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];
const MONTH_LABELS = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

export function Calendar({
  selectedDate,
  onSelect,
}: {
  selectedDate: string | null;
  onSelect: (date: string) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startDow = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const maxDate = new Date(today);
  maxDate.setMonth(maxDate.getMonth() + 2);

  const canPrev =
    viewYear > today.getFullYear() || viewMonth > today.getMonth();
  const canNext = new Date(viewYear, viewMonth + 1, 1) <= maxDate;

  const goMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const pad = (n: number) => n.toString().padStart(2, "0");

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className="mb-1 text-base font-semibold text-[#3a3632]">
        日付を選択
      </div>
      <p className="text-[13px] text-[#9e9893] mb-5">
        ご希望の日付をお選びください
      </p>

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => goMonth(-1)}
          disabled={!canPrev}
          className="w-8 h-8 rounded-full border border-[#e8e4df] flex items-center justify-center text-[#6b6560] hover:bg-[#f5f0eb] hover:border-[#e2cf8e] disabled:opacity-30 disabled:hover:bg-transparent transition-all"
        >
          ←
        </button>
        <span className="text-[15px] font-semibold text-[#3a3632]">
          {viewYear}年 {MONTH_LABELS[viewMonth]}
        </span>
        <button
          onClick={() => goMonth(1)}
          disabled={!canNext}
          className="w-8 h-8 rounded-full border border-[#e8e4df] flex items-center justify-center text-[#6b6560] hover:bg-[#f5f0eb] hover:border-[#e2cf8e] disabled:opacity-30 disabled:hover:bg-transparent transition-all"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_LABELS.map((w, i) => (
          <div
            key={w}
            className={`text-[11px] font-medium py-2 ${
              i === 0
                ? "text-[#c66]"
                : i === 6
                  ? "text-[#668ebc]"
                  : "text-[#9e9893]"
            }`}
          >
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;

          const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
          const date = new Date(viewYear, viewMonth, day);
          const isPast = date < today;
          const isBeyond = date > maxDate;
          const disabled = isPast || isBeyond;
          const isSelected = dateStr === selectedDate;
          const isToday = date.getTime() === today.getTime();
          const dow = date.getDay();

          return (
            <button
              key={dateStr}
              disabled={disabled}
              onClick={() => onSelect(dateStr)}
              className={`py-2.5 rounded-lg text-sm transition-all border ${
                disabled
                  ? "text-[#e8e4df] cursor-not-allowed border-transparent"
                  : isSelected
                    ? "bg-[#c8a84e] text-white font-semibold border-[#c8a84e]"
                    : isToday
                      ? "border-[#e2cf8e] text-[#a88b2f] font-semibold hover:bg-[#f5f0eb]"
                      : dow === 0
                        ? "text-[#c66] border-transparent hover:bg-[#f5f0eb]"
                        : dow === 6
                          ? "text-[#668ebc] border-transparent hover:bg-[#f5f0eb]"
                          : "text-[#3a3632] border-transparent hover:bg-[#f5f0eb]"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
