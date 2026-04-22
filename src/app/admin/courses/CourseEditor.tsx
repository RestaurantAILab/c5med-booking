"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { createCourse, updateCourse, deleteCourse } from "./actions";

type CourseInput = {
  id: number;
  name: string;
  description: string | null;
  category: string;
  durationMin: number;
  price: number;
  memberPrice: number | null;
  tags: string[] | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
};

const CATEGORY_OPTIONS = [
  { value: "facial", label: "フェイシャル" },
  { value: "premium", label: "プレミアム（全身＋顔）" },
  { value: "body", label: "ボディ" },
  { value: "eye", label: "アイケア" },
  { value: "head", label: "ヘッド／スカルプ" },
];

export function CourseEditor({ course }: { course?: CourseInput }) {
  const isEdit = !!course;
  const [preview, setPreview] = useState<string | null>(course?.imageUrl ?? null);
  const [removeImage, setRemoveImage] = useState(false);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRemoveImage(false);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onSubmit = (fd: FormData) => {
    setErr(null);
    startTransition(async () => {
      try {
        if (isEdit && course) {
          await updateCourse(course.id, fd);
        } else {
          await createCourse(fd);
        }
      } catch (e) {
        setErr(e instanceof Error ? e.message : "保存に失敗しました");
      }
    });
  };

  const onDelete = () => {
    if (!course) return;
    if (!confirm(`「${course.name}」を削除します。よろしいですか？`)) return;
    startTransition(async () => {
      try {
        await deleteCourse(course.id);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "削除に失敗しました");
      }
    });
  };

  return (
    <form
      action={onSubmit}
      className="bg-white border border-[#e8e4df] rounded-xl p-6 space-y-5"
    >
      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-[13px] px-4 py-3">
          {err}
        </div>
      )}

      <Field label="コース名">
        <input
          name="name"
          type="text"
          required
          defaultValue={course?.name}
          className={INPUT}
        />
      </Field>

      <Field label="説明">
        <textarea
          name="description"
          rows={4}
          defaultValue={course?.description ?? ""}
          className={`${INPUT} resize-y`}
          placeholder="施術内容の説明。※上清液あり ＋6,600円 のような注記もここに。"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="カテゴリ">
          <select
            name="category"
            defaultValue={course?.category ?? "facial"}
            className={INPUT}
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="並び順">
          <input
            name="sortOrder"
            type="number"
            defaultValue={course?.sortOrder ?? 0}
            className={INPUT}
          />
        </Field>
        <Field label="所要時間(分)">
          <input
            name="durationMin"
            type="number"
            required
            min={5}
            defaultValue={course?.durationMin}
            className={INPUT}
          />
        </Field>
        <Field label="価格(円)">
          <input
            name="price"
            type="number"
            required
            min={0}
            defaultValue={course?.price}
            className={INPUT}
          />
        </Field>
        <Field label="会員価格(円)">
          <input
            name="memberPrice"
            type="number"
            min={0}
            defaultValue={course?.memberPrice ?? ""}
            className={INPUT}
          />
        </Field>
        <Field label="タグ（カンマ区切り）">
          <input
            name="tags"
            type="text"
            defaultValue={course?.tags?.join(", ") ?? ""}
            className={INPUT}
            placeholder="リフトアップ, 人気"
          />
        </Field>
      </div>

      <Field label="アイキャッチ画像">
        <div className="flex items-start gap-4">
          <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-[#faf9f7] border border-[#e8e4df]">
            {preview && !removeImage ? (
              <Image
                src={preview}
                alt=""
                fill
                sizes="128px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[11px] text-[#9e9893]">
                No image
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={onPickImage}
              className="block w-full text-[12px] text-[#6b6560]
                file:mr-3 file:py-2 file:px-4
                file:rounded-md file:border file:border-[#e8e4df]
                file:bg-white file:text-[#3a3632]
                file:text-[12px] file:font-semibold
                hover:file:border-[#c8a84e]"
            />
            {isEdit && course?.imageUrl && (
              <label className="flex items-center gap-2 text-[12px] text-[#6b6560]">
                <input
                  type="checkbox"
                  name="removeImage"
                  checked={removeImage}
                  onChange={(e) => {
                    setRemoveImage(e.target.checked);
                    if (e.target.checked) setPreview(null);
                    else setPreview(course.imageUrl);
                  }}
                  className="w-4 h-4 accent-[#c8a84e]"
                />
                現在の画像を削除
              </label>
            )}
            <p className="text-[11px] text-[#9e9893]">
              Vercel Blob にアップロードされます（PNG/JPG 推奨）
            </p>
          </div>
        </div>
      </Field>

      <label className="flex items-center gap-2 text-[13px] text-[#3a3632]">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={course?.isActive ?? true}
          className="w-4 h-4 accent-[#c8a84e]"
        />
        公開中（チェックを外すと公開側に表示されません）
      </label>

      <div className="flex items-center justify-between pt-4 border-t border-[#f0ece7]">
        {isEdit ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className="text-[13px] text-red-600 hover:underline disabled:opacity-40"
          >
            このコースを削除
          </button>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2.5 bg-[#c8a84e] hover:bg-[#a88b2f] disabled:opacity-50 text-white text-[14px] font-semibold rounded-lg shadow-[0_2px_8px_rgba(200,168,78,0.3)]"
        >
          {pending ? "保存中..." : isEdit ? "更新" : "作成"}
        </button>
      </div>
    </form>
  );
}

const INPUT =
  "w-full px-3 py-2 text-[13px] bg-white border border-[#e8e4df] rounded-md focus:outline-none focus:border-[#c8a84e] text-[#3a3632]";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-[#6b6560] mb-1.5 tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}
