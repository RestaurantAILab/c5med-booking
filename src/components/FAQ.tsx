"use client";

import { useState } from "react";

type FAQItem = {
  question: string;
  answer: string;
};

export function FAQ({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className="border border-[#e8e4df] rounded-xl overflow-hidden bg-white"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#faf9f7] transition-colors"
            >
              <div className="flex items-start gap-3 flex-1">
                <span className="text-[#c8a84e] font-bold text-sm shrink-0 mt-0.5">
                  Q
                </span>
                <span className="text-[14px] font-medium text-[#3a3632]">
                  {item.question}
                </span>
              </div>
              <span
                className={`text-[#9e9893] text-lg ml-3 shrink-0 transition-transform duration-200 ${
                  isOpen ? "rotate-45" : ""
                }`}
              >
                +
              </span>
            </button>
            <div
              className={`overflow-hidden transition-all duration-200 ${
                isOpen ? "max-h-60" : "max-h-0"
              }`}
            >
              <div className="px-5 pb-4 flex gap-3">
                <span className="text-[#7d9e82] font-bold text-sm shrink-0">
                  A
                </span>
                <p className="text-[13px] text-[#6b6560] leading-relaxed">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
