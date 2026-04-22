import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses, storeCourses } from "@/lib/db/schema";

export async function GET(request: NextRequest) {
  const storeId = request.nextUrl.searchParams.get("storeId");

  if (!storeId) {
    return NextResponse.json(
      { error: "storeId is required" },
      { status: 400 }
    );
  }

  const result = await db
    .select({
      id: courses.id,
      name: courses.name,
      description: courses.description,
      category: courses.category,
      durationMin: courses.durationMin,
      price: courses.price,
      tags: courses.tags,
      imageUrl: courses.imageUrl,
      sortOrder: courses.sortOrder,
    })
    .from(storeCourses)
    .innerJoin(courses, eq(storeCourses.courseId, courses.id))
    .where(and(eq(storeCourses.storeId, storeId), eq(courses.isActive, true)))
    .orderBy(courses.sortOrder);

  return NextResponse.json({ courses: result });
}
