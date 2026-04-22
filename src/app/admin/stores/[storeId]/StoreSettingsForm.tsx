"use client";

import { useMemo, useState, useTransition } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import type { BusinessHours } from "@/lib/db/schema";
import { saveStoreSettings } from "./actions";

type StoreRow = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  nearestStation: string | null;
  calendarId: string;
  timezone: string;
  businessHours: BusinessHours;
  slotIntervalMin: number;
  bufferMin: number;
  lastAcceptMinBeforeClose: number;
  advanceBookingDays: number;
  closedOnHolidays: boolean;
};

type CourseRow = {
  id: number;
  name: string;
  category: string;
  durationMin: number;
  price: number;
};

type Range = { start: string; end: string };
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
type DayKey = (typeof DAY_KEYS)[number];
const DAY_LABELS: Record<DayKey, string> = {
  mon: "月",
  tue: "火",
  wed: "水",
  thu: "木",
  fri: "金",
  sat: "土",
  sun: "日",
};

function parseRanges(hours: BusinessHours, day: DayKey): Range[] {
  const arr = hours[day];
  if (!Array.isArray(arr)) return [];
  return arr
    .map((s) => {
      const [start, end] = s.split("-").map((x) => x.trim());
      return { start, end };
    })
    .filter((r) => r.start && r.end);
}

function dateToStr(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function strToDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function StoreSettingsForm({
  store,
  allCourses,
  linkedCourseIds,
  holidayDates,
}: {
  store: StoreRow;
  allCourses: CourseRow[];
  linkedCourseIds: number[];
  holidayDates: string[];
}) {
  const [name, setName] = useState(store.name);
  const [address, setAddress] = useState(store.address ?? "");
  const [phone, setPhone] = useState(store.phone ?? "");
  const [station, setStation] = useState(store.nearestStation ?? "");
  const [calendarId, setCalendarId] = useState(store.calendarId);
  const [timezone, setTimezone] = useState(store.timezone);
  const [slotIntervalMin, setSlotIntervalMin] = useState(store.slotIntervalMin);
  const [bufferMin, setBufferMin] = useState(store.bufferMin);
  const [lastAccept, setLastAccept] = useState(store.lastAcceptMinBeforeClose);
  const [advanceDays, setAdvanceDays] = useState(store.advanceBookingDays);
  const [closedOnHolidays, setClosedOnHolidays] = useState(
    store.closedOnHolidays
  );

  const [hours, setHours] = useState<Record<DayKey, Range[]>>(() => {
    const out = {} as Record<DayKey, Range[]>;
    for (const d of DAY_KEYS) out[d] = parseRanges(store.businessHours, d);
    return out;
  });

  const [holidays, setHolidays] = useState<Date[]>(
    holidayDates.map(strToDate)
  );

  const [selectedCourses, setSelectedCourses] = useState<Set<number>>(
    new Set(linkedCourseIds)
  );

  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<
    { type: "ok" | "err"; text: string } | null
  >(null);

  const coursesByCategory = useMemo(() => {
    const groups: Record<string, CourseRow[]> = {};
    for (const c of allCourses) {
      (groups[c.category] ??= []).push(c);
    }
    return groups;
  }, [allCourses]);

  const addRange = (day: DayKey) => {
    setHours((h) => ({
      ...h,
      [day]: [...h[day], { start: "10:00", end: "19:00" }],
    }));
  };
  const removeRange = (day: DayKey, idx: number) => {
    setHours((h) => ({
      ...h,
      [day]: h[day].filter((_, i) => i !== idx),
    }));
  };
  const updateRange = (
    day: DayKey,
    idx: number,
    key: "start" | "end",
    value: string
  ) => {
    setHours((h) => ({
      ...h,
      [day]: h[day].map((r, i) => (i === idx ? { ...r, [key]: value } : r)),
    }));
  };
  const toggleClosed = (day: DayKey) => {
    setHours((h) => ({
      ...h,
      [day]: h[day].length > 0 ? [] : [{ start: "10:00", end: "19:00" }],
    }));
  };

  const toggleCourse = (cid: number) => {
    setSelectedCourses((s) => {
      const n = new Set(s);
      if (n.has(cid)) n.delete(cid);
      else n.add(cid);
      return n;
    });
  };

  const onSubmit = () => {
    setMessage(null);
    const payload = {
      name,
      address: address || null,
      phone: phone || null,
      nearestStation: station || null,
      calendarId,
      timezone,
      slotIntervalMin,
      bufferMin,
      lastAcceptMinBeforeClose: lastAccept,
      advanceBookingDays: advanceDays,
      closedOnHolidays,
      businessHours: hours,
      holidayDates: holidays.map(dateToStr),
      courseIds: Array.from(selectedCourses),
    };

    const fd = new FormData();
    fd.append("payload", JSON.stringify(payload));

    startTransition(async () => {
      const res = await saveStoreSettings(store.id, fd);
      if (res.ok) {
        setMessage({ type: "ok", text: "保存しました" });
      } else {
        setMessage({ type: "err", text: res.error });
      }
    });
  };

  return (
    <div className="space-y-8">
      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-[13px] ${
            message.type === "ok"
              ? "border-[#cfe2d2] bg-[#f0f5f1] text-[#4f7a56]"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 基本情報 */}
      <section className="bg-white border border-[#e8e4df] rounded-xl p-6">
        <h2 className="text-[15px] font-semibold text-[#3a3632] mb-5">
          基本情報
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="店舗名">
            <input
              type="text"
              className={INPUT}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="タイムゾーン">
            <input
              type="text"
              className={INPUT}
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            />
          </Field>
          <Field label="住所" full>
            <input
              type="text"
              className={INPUT}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Field>
          <Field label="電話番号">
            <input
              type="text"
              className={INPUT}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          <Field label="最寄り駅・アクセス">
            <input
              type="text"
              className={INPUT}
              value={station}
              onChange={(e) => setStation(e.target.value)}
            />
          </Field>
          <Field label="Google Calendar ID" full>
            <input
              type="text"
              className={`${INPUT} font-mono text-[12px]`}
              value={calendarId}
              onChange={(e) => setCalendarId(e.target.value)}
            />
          </Field>
        </div>
      </section>

      {/* 予約ルール */}
      <section className="bg-white border border-[#e8e4df] rounded-xl p-6">
        <h2 className="text-[15px] font-semibold text-[#3a3632] mb-5">
          予約ルール
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NumField
            label="スロット刻み(分)"
            value={slotIntervalMin}
            onChange={setSlotIntervalMin}
          />
          <NumField
            label="前後バッファ(分)"
            value={bufferMin}
            onChange={setBufferMin}
          />
          <NumField
            label="最終受付(閉店の何分前)"
            value={lastAccept}
            onChange={setLastAccept}
          />
          <NumField
            label="予約可能日数"
            value={advanceDays}
            onChange={setAdvanceDays}
          />
        </div>
        <label className="mt-5 flex items-center gap-2 text-[13px] text-[#3a3632] cursor-pointer">
          <input
            type="checkbox"
            checked={closedOnHolidays}
            onChange={(e) => setClosedOnHolidays(e.target.checked)}
            className="w-4 h-4 accent-[#c8a84e]"
          />
          祝日は休み
        </label>
      </section>

      {/* 曜日別営業時間 */}
      <section className="bg-white border border-[#e8e4df] rounded-xl p-6">
        <h2 className="text-[15px] font-semibold text-[#3a3632] mb-5">
          曜日別営業時間
        </h2>
        <div className="space-y-3">
          {DAY_KEYS.map((day) => {
            const ranges = hours[day];
            const closed = ranges.length === 0;
            return (
              <div
                key={day}
                className="flex items-start gap-3 p-3 border border-[#f0ece7] rounded-lg"
              >
                <div className="w-10 text-center pt-2 font-semibold text-[#3a3632]">
                  {DAY_LABELS[day]}
                </div>
                <label className="pt-2 flex items-center gap-1.5 text-[12px] text-[#6b6560] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={closed}
                    onChange={() => toggleClosed(day)}
                    className="w-4 h-4 accent-[#c8a84e]"
                  />
                  休み
                </label>
                <div className="flex-1 space-y-2">
                  {closed ? (
                    <p className="text-[12px] text-[#9e9893] py-2">
                      この曜日は休業
                    </p>
                  ) : (
                    <>
                      {ranges.map((r, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="time"
                            className={`${INPUT} w-32`}
                            value={r.start}
                            onChange={(e) =>
                              updateRange(day, idx, "start", e.target.value)
                            }
                          />
                          <span className="text-[#9e9893]">〜</span>
                          <input
                            type="time"
                            className={`${INPUT} w-32`}
                            value={r.end}
                            onChange={(e) =>
                              updateRange(day, idx, "end", e.target.value)
                            }
                          />
                          <button
                            type="button"
                            onClick={() => removeRange(day, idx)}
                            className="text-[11px] px-2 py-1 text-[#6b6560] hover:text-red-600"
                          >
                            削除
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addRange(day)}
                        className="text-[11px] px-2 py-1 border border-[#e8e4df] rounded text-[#6b6560] hover:border-[#c8a84e] hover:text-[#a88b2f]"
                      >
                        + 時間帯を追加
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 例外休日 */}
      <section className="bg-white border border-[#e8e4df] rounded-xl p-6">
        <h2 className="text-[15px] font-semibold text-[#3a3632] mb-2">
          例外休日
        </h2>
        <p className="text-[12px] text-[#6b6560] mb-4">
          カレンダーから日付をクリックして選択/解除してください（複数選択可）
        </p>
        <div className="flex flex-col md:flex-row gap-6">
          <DayPicker
            mode="multiple"
            selected={holidays}
            onSelect={(v) => setHolidays(v ?? [])}
            locale={undefined}
            weekStartsOn={0}
          />
          <div className="flex-1">
            <p className="text-[12px] font-semibold text-[#6b6560] mb-2">
              選択中 ({holidays.length}件)
            </p>
            <div className="flex flex-wrap gap-2">
              {holidays
                .slice()
                .sort((a, b) => a.getTime() - b.getTime())
                .map((d) => (
                  <span
                    key={d.toISOString()}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-[#faf9f7] border border-[#e8e4df] rounded-full text-[#3a3632]"
                  >
                    {dateToStr(d)}
                    <button
                      type="button"
                      onClick={() =>
                        setHolidays((hs) =>
                          hs.filter((x) => x.getTime() !== d.getTime())
                        )
                      }
                      className="text-[#9e9893] hover:text-red-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* コース紐付け */}
      <section className="bg-white border border-[#e8e4df] rounded-xl p-6">
        <h2 className="text-[15px] font-semibold text-[#3a3632] mb-5">
          提供コース（{selectedCourses.size} 件選択中）
        </h2>
        {Object.entries(coursesByCategory).map(([cat, list]) => (
          <div key={cat} className="mb-5">
            <p className="text-[11px] font-semibold text-[#c8a84e] tracking-widest uppercase mb-2">
              {cat}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {list.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 p-2.5 border border-[#f0ece7] rounded-md hover:border-[#c8a84e] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedCourses.has(c.id)}
                    onChange={() => toggleCourse(c.id)}
                    className="w-4 h-4 accent-[#c8a84e]"
                  />
                  <span className="flex-1 text-[13px] text-[#3a3632]">
                    {c.name}
                  </span>
                  <span className="text-[11px] text-[#9e9893]">
                    {c.durationMin}分 / ¥{c.price.toLocaleString()}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </section>

      <div className="sticky bottom-0 bg-white border-t border-[#e8e4df] -mx-6 px-6 py-3 flex justify-end gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={pending}
          className="px-6 py-2.5 bg-[#c8a84e] hover:bg-[#a88b2f] disabled:opacity-50 text-white text-[14px] font-semibold rounded-lg shadow-[0_2px_8px_rgba(200,168,78,0.3)]"
        >
          {pending ? "保存中..." : "設定を保存"}
        </button>
      </div>
    </div>
  );
}

const INPUT =
  "w-full px-3 py-2 text-[13px] bg-white border border-[#e8e4df] rounded-md focus:outline-none focus:border-[#c8a84e] text-[#3a3632]";

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="block text-[11px] font-semibold text-[#6b6560] mb-1.5 tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-[#6b6560] mb-1.5 tracking-wide">
        {label}
      </label>
      <input
        type="number"
        className={INPUT}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
