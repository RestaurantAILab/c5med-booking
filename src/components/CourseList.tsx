"use client";

type Course = {
  id: number;
  name: string;
  description: string | null;
  category: string;
  durationMin: number;
  price: number;
  tags: string[] | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  facial: "フェイシャル",
  body: "ボディ・痩身",
  relax: "リラク",
};

function TagPill({ tag }: { tag: string }) {
  if (tag === "人気" || tag === "初回おすすめ" || tag === "毛穴ケア") {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#e8f0e9] text-[#7d9e82]">
        {tag}
      </span>
    );
  }
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#fef8ea] text-[#a88b2f]">
      {tag}
    </span>
  );
}

export function CourseList({
  courses,
  selectedId,
  onSelect,
}: {
  courses: Course[];
  selectedId: number | null;
  onSelect: (course: Course) => void;
}) {
  const grouped = courses.reduce(
    (acc, c) => {
      (acc[c.category] ??= []).push(c);
      return acc;
    },
    {} as Record<string, Course[]>
  );

  return (
    <div>
      <div className="mb-1 text-base font-semibold text-[#3a3632]">
        コースを選択してください
      </div>
      <p className="text-[13px] text-[#9e9893] mb-5">
        お悩みに合わせた施術をお選びいただけます
      </p>

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <div className="text-xs font-semibold text-[#c8a84e] tracking-widest uppercase mb-2.5 mt-5 first:mt-0">
            {CATEGORY_LABELS[category] ?? category}
          </div>
          <div className="space-y-2">
            {items.map((course) => (
              <button
                key={course.id}
                onClick={() => onSelect(course)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selectedId === course.id
                    ? "border-[#c8a84e] bg-white shadow-[0_0_0_1px_#c8a84e]"
                    : "border-[#e8e4df] bg-[#faf9f7] hover:border-[#e2cf8e] hover:bg-white"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#3a3632]">
                      {course.name}
                    </p>
                    {course.description && (
                      <p className="text-xs text-[#6b6560] mt-1 leading-relaxed">
                        {course.description}
                      </p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#f5f0eb] text-[#6b6560]">
                        {course.durationMin}分
                      </span>
                      {course.tags?.map((tag) => (
                        <TagPill key={tag} tag={tag} />
                      ))}
                    </div>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <p className="text-[15px] font-bold text-[#a88b2f]">
                      ¥{course.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
