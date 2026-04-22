"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { put, del } from "@vercel/blob";
import { z } from "zod";
import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { auth } from "@/auth";

const courseSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  category: z.string().min(1),
  durationMin: z.coerce.number().int().min(5).max(600),
  price: z.coerce.number().int().min(0),
  memberPrice: z.coerce.number().int().min(0).optional().nullable(),
  tags: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

function parseFormValues(fd: FormData) {
  const tagsRaw = (fd.get("tags") as string | null) ?? "";
  const tags = tagsRaw
    .split(/[,、]/)
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    data: courseSchema.parse({
      name: fd.get("name"),
      description: fd.get("description") || null,
      category: fd.get("category"),
      durationMin: fd.get("durationMin"),
      price: fd.get("price"),
      memberPrice: fd.get("memberPrice") || null,
      tags: tagsRaw,
      sortOrder: fd.get("sortOrder") || 0,
      isActive: fd.get("isActive") === "on",
    }),
    tags,
  };
}

async function uploadImageIfPresent(fd: FormData): Promise<string | null> {
  const file = fd.get("image");
  if (!(file instanceof File) || file.size === 0) return null;

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN が未設定のため画像アップロードができません"
    );
  }

  const ext = file.name.split(".").pop() || "bin";
  const key = `courses/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;

  const blob = await put(key, file, {
    access: "public",
    token,
    contentType: file.type || undefined,
  });

  return blob.url;
}

export async function createCourse(fd: FormData) {
  await requireAuth();
  const { data, tags } = parseFormValues(fd);
  const imageUrl = await uploadImageIfPresent(fd);

  const [row] = await db
    .insert(courses)
    .values({
      name: data.name,
      description: data.description ?? null,
      category: data.category,
      durationMin: data.durationMin,
      price: data.price,
      memberPrice: data.memberPrice ?? null,
      tags: tags.length > 0 ? tags : null,
      imageUrl,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    })
    .returning({ id: courses.id });

  revalidatePath("/admin/courses");
  redirect(`/admin/courses/${row.id}`);
}

export async function updateCourse(courseId: number, fd: FormData) {
  await requireAuth();
  const { data, tags } = parseFormValues(fd);
  const removeImage = fd.get("removeImage") === "on";

  // 現行コースを取得（古い画像削除判断に使う）
  const [existing] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);
  if (!existing) throw new Error("Course not found");

  let imageUrl: string | null | undefined = undefined;
  const newImage = await uploadImageIfPresent(fd);
  if (newImage) {
    imageUrl = newImage;
    if (existing.imageUrl) {
      await del(existing.imageUrl, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      }).catch(() => {});
    }
  } else if (removeImage && existing.imageUrl) {
    imageUrl = null;
    await del(existing.imageUrl, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }).catch(() => {});
  }

  await db
    .update(courses)
    .set({
      name: data.name,
      description: data.description ?? null,
      category: data.category,
      durationMin: data.durationMin,
      price: data.price,
      memberPrice: data.memberPrice ?? null,
      tags: tags.length > 0 ? tags : null,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
      ...(imageUrl !== undefined ? { imageUrl } : {}),
    })
    .where(eq(courses.id, courseId));

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function deleteCourse(courseId: number) {
  await requireAuth();
  const [existing] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);
  if (existing?.imageUrl) {
    await del(existing.imageUrl, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }).catch(() => {});
  }
  await db.delete(courses).where(eq(courses.id, courseId));
  revalidatePath("/admin/courses");
  redirect("/admin/courses");
}
