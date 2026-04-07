"use client";

import { useState } from "react";

export type BookingFormData = {
  name: string;
  email: string;
  phone: string;
  note: string;
};

export function BookingForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (data: BookingFormData) => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState<BookingFormData>({
    name: "",
    email: "",
    phone: "",
    note: "",
  });
  const [errors, setErrors] = useState<Partial<BookingFormData>>({});

  const validate = () => {
    const e: Partial<BookingFormData> = {};
    if (!form.name.trim()) e.name = "お名前を入力してください";
    if (!form.email.trim()) e.email = "メールアドレスを入力してください";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "有効なメールアドレスを入力してください";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  const inputClass =
    "w-full bg-[#faf9f7] border border-[#e8e4df] rounded-lg px-3.5 py-3 text-[#3a3632] text-[15px] placeholder:text-[#9e9893] placeholder:text-sm focus:outline-none focus:border-[#c8a84e] focus:shadow-[0_0_0_3px_rgba(200,168,78,0.12)] focus:bg-white transition-all";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-1 text-base font-semibold text-[#3a3632]">
        お客様情報
      </div>
      <p className="text-[13px] text-[#9e9893] mb-5">
        予約確認メールをお送りします
      </p>

      <div>
        <label className="block text-[13px] font-medium text-[#6b6560] mb-1.5">
          お名前 <span className="text-[#c66] text-[11px] ml-1">必須</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="山田 太郎"
          className={inputClass}
        />
        {errors.name && (
          <p className="text-[#c66] text-xs mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-[13px] font-medium text-[#6b6560] mb-1.5">
          メールアドレス{" "}
          <span className="text-[#c66] text-[11px] ml-1">必須</span>
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="example@email.com"
          className={inputClass}
        />
        {errors.email && (
          <p className="text-[#c66] text-xs mt-1">{errors.email}</p>
        )}
      </div>

      <div>
        <label className="block text-[13px] font-medium text-[#6b6560] mb-1.5">
          電話番号
        </label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="090-1234-5678"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-[13px] font-medium text-[#6b6560] mb-1.5">
          備考
        </label>
        <textarea
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          placeholder="ご要望等がありましたらご記入ください"
          rows={3}
          className={`${inputClass} resize-y min-h-[80px]`}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3.5 bg-[#c8a84e] hover:bg-[#a88b2f] text-white font-semibold rounded-lg transition-all tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "予約処理中..." : "予約を確定する"}
      </button>
    </form>
  );
}
