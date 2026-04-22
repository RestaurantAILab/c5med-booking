"use client";

import { useState, useEffect } from "react";
import { CourseList } from "./CourseList";
import { WeeklyCalendar } from "./WeeklyCalendar";
import { BookingForm, type BookingFormData } from "./BookingForm";
import { BookingConfirmation } from "./BookingConfirmation";

type Course = {
  id: number;
  name: string;
  description: string | null;
  category: string;
  durationMin: number;
  price: number;
  tags: string[] | null;
  imageUrl?: string | null;
};

type Step = "course" | "datetime" | "form" | "done";

export function BookingWidget({
  storeId,
  storeName,
}: {
  storeId: string;
  storeName: string;
}) {
  const [step, setStep] = useState<Step>("course");
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    fetch(`/api/courses?storeId=${storeId}`)
      .then((r) => r.json())
      .then((d) => setCourses(d.courses))
      .catch(() => setError("コースの取得に失敗しました"));
  }, [storeId]);

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setSelectedSlot(null);
    setStep("datetime");
  };

  const handleSlotSelect = (startTime: string) => {
    setSelectedSlot(startTime);
    setStep("form");
  };

  const handleSubmit = async (formData: BookingFormData) => {
    if (!selectedCourse || !selectedSlot || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          courseId: selectedCourse.id,
          bookedAt: selectedSlot,
          ...formData,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "予約に失敗しました");
      }

      setCustomerName(formData.name);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "予約に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels: { key: Step; label: string }[] = [
    { key: "course", label: "コース" },
    { key: "datetime", label: "日時" },
    { key: "form", label: "情報入力" },
  ];

  const currentIdx = stepLabels.findIndex((s) => s.key === step);

  return (
    <div className="bg-white border border-[#e8e4df] rounded-2xl p-6 sm:p-8 shadow-[0_8px_24px_rgba(58,54,50,0.1)]">
      {/* Progress steps */}
      {step !== "done" && (
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#f0ece7]">
          {stepLabels.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <button
                onClick={() => {
                  if (i < currentIdx) setStep(s.key);
                }}
                disabled={i >= currentIdx}
                className={`flex items-center gap-2 text-[13px] transition-colors ${
                  i === currentIdx
                    ? "text-[#a88b2f] font-semibold"
                    : i < currentIdx
                      ? "text-[#7d9e82] cursor-pointer"
                      : "text-[#9e9893]"
                }`}
              >
                <span
                  className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-xs font-semibold border-[1.5px] ${
                    i === currentIdx
                      ? "bg-[#c8a84e] text-white border-[#c8a84e]"
                      : i < currentIdx
                        ? "bg-[#e8f0e9] text-[#7d9e82] border-[#e8f0e9]"
                        : "bg-[#faf9f7] text-[#9e9893] border-[#e8e4df]"
                  }`}
                >
                  {i < currentIdx ? "✓" : i + 1}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < stepLabels.length - 1 && (
                <div
                  className={`w-12 sm:w-16 h-px mx-3 ${
                    i < currentIdx ? "bg-[#e8f0e9]" : "bg-[#f0ece7]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-400 hover:text-red-600"
          >
            ×
          </button>
        </div>
      )}

      {step === "course" && (
        <CourseList
          courses={courses}
          selectedId={selectedCourse?.id ?? null}
          onSelect={handleCourseSelect}
        />
      )}

      {step === "datetime" && selectedCourse && (
        <WeeklyCalendar
          storeId={storeId}
          courseId={selectedCourse.id}
          selectedSlot={selectedSlot}
          onSelect={handleSlotSelect}
        />
      )}

      {step === "form" && (
        <BookingForm onSubmit={handleSubmit} submitting={submitting} />
      )}

      {step === "done" && selectedCourse && selectedSlot && (
        <BookingConfirmation
          storeName={storeName}
          courseName={selectedCourse.name}
          price={selectedCourse.price}
          bookedAt={selectedSlot}
          customerName={customerName}
        />
      )}
    </div>
  );
}
