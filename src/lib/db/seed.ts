import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { stores, courses, storeCourses } from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const storeData = [
  {
    id: "shin-kobe",
    name: "新神戸店",
    address: "兵庫県神戸市中央区",
    timezone: "Asia/Tokyo",
    calendarId: "5949a8cbdc44878030d3660d4a42a545c660d64bd5c63ccb21ac6d08e9111cd8@group.calendar.google.com",
    businessHours: {
      mon: ["10:00-19:00"],
      tue: ["10:00-19:00"],
      wed: [],
      thu: ["10:00-19:00"],
      fri: ["10:00-19:00"],
      sat: ["10:00-19:00"],
      sun: ["10:00-19:00"],
      slot_interval_min: 30,
    },
  },
  {
    id: "sapporo-nishi11",
    name: "札幌西11丁目店",
    address: "北海道札幌市中央区",
    timezone: "Asia/Tokyo",
    calendarId: "65610c0322ae762efa23b4130f3a9a3fdb43baa00d18a912be672c4aed15ac95@group.calendar.google.com",
    businessHours: {
      mon: ["10:00-19:00"],
      tue: ["10:00-19:00"],
      wed: ["10:00-19:00"],
      thu: [],
      fri: ["10:00-19:00"],
      sat: ["10:00-19:00"],
      sun: ["10:00-19:00"],
      slot_interval_min: 30,
    },
  },
  {
    id: "sapporo-kita2",
    name: "札幌北2条店",
    address: "北海道札幌市中央区北2条",
    timezone: "Asia/Tokyo",
    calendarId: "4463588576869cfe54c0c1076e98816d9e7e45271f7c20ee53d78dd0c7eed054@group.calendar.google.com",
    businessHours: {
      mon: ["10:00-19:00"],
      tue: ["10:00-19:00"],
      wed: ["10:00-19:00"],
      thu: [],
      fri: ["10:00-19:00"],
      sat: ["10:00-19:00"],
      sun: ["10:00-19:00"],
      slot_interval_min: 30,
    },
  },
  {
    id: "nagoya-hilton",
    name: "名古屋ヒルトン店",
    address: "愛知県名古屋市中村区",
    timezone: "Asia/Tokyo",
    calendarId: "a08ef7bb32ffa1532b257cbe820338bc1d1c1630c046d23beb362e3b65298997@group.calendar.google.com",
    businessHours: {
      mon: ["10:00-19:00"],
      tue: ["10:00-19:00"],
      wed: [],
      thu: ["10:00-19:00"],
      fri: ["10:00-19:00"],
      sat: ["10:00-19:00"],
      sun: ["10:00-19:00"],
      slot_interval_min: 30,
    },
  },
  {
    id: "kyoto",
    name: "京都店",
    address: "京都府京都市中京区",
    timezone: "Asia/Tokyo",
    calendarId: "ed7390c5164439e167e201361ddb9333fafeaaecb502dfd2b61bdfc33542251a@group.calendar.google.com",
    businessHours: {
      mon: ["10:00-19:00"],
      tue: ["10:00-19:00"],
      wed: [],
      thu: ["10:00-19:00"],
      fri: ["10:00-19:00"],
      sat: ["10:00-19:00"],
      sun: ["10:00-19:00"],
      slot_interval_min: 30,
    },
  },
  {
    id: "shimbashi",
    name: "新橋店",
    address: "東京都港区新橋",
    timezone: "Asia/Tokyo",
    calendarId: "e644b570682a99c2dac93cbba2e669218cf24deda234255b2b8a158f565c54a8@group.calendar.google.com",
    businessHours: {
      mon: ["10:00-19:00"],
      tue: ["10:00-19:00"],
      wed: [],
      thu: ["10:00-19:00"],
      fri: ["10:00-19:00"],
      sat: ["10:00-19:00"],
      sun: ["10:00-19:00"],
      slot_interval_min: 30,
    },
  },
  {
    id: "fukuoka-c5clinic",
    name: "福岡 C5クリニック内",
    address: "福岡県福岡市中央区",
    timezone: "Asia/Tokyo",
    calendarId: "dd1e679dfe4a618e5bf5d21cc367dad62ea40cf2f288074652f698894064b8d1@group.calendar.google.com",
    businessHours: {
      mon: ["10:00-13:00", "14:00-19:00"],
      tue: ["10:00-13:00", "14:00-19:00"],
      wed: [],
      thu: ["10:00-13:00", "14:00-19:00"],
      fri: ["10:00-13:00", "14:00-19:00"],
      sat: ["10:00-18:00"],
      sun: [],
      slot_interval_min: 30,
    },
  },
];

const courseData = [
  {
    name: "超音波毛穴洗浄",
    description: "超音波の振動で毛穴の汚れを徹底除去",
    category: "facial",
    durationMin: 30,
    price: 3000,
    tags: ["初回おすすめ", "毛穴ケア"],
    sortOrder: 1,
  },
  {
    name: "毛穴洗浄＋ピーリング",
    description: "超音波毛穴洗浄に加え、ピーリングで角質ケア",
    category: "facial",
    durationMin: 30,
    price: 3850,
    tags: ["毛穴ケア", "角質ケア"],
    sortOrder: 2,
  },
  {
    name: "幹細胞エイジング毛穴ケア",
    description: "ヒト幹細胞上清液を使用したエイジングケア",
    category: "facial",
    durationMin: 45,
    price: 4980,
    tags: ["幹細胞", "エイジングケア"],
    sortOrder: 3,
  },
  {
    name: "シナトックス導入 小顔フェイシャル",
    description: "シナトックス導入で小顔効果を実現するフェイシャル",
    category: "facial",
    durationMin: 45,
    price: 4980,
    tags: ["小顔", "リフトアップ"],
    sortOrder: 4,
  },
  {
    name: "高濃度幹細胞フェイシャル",
    description: "高濃度のヒト幹細胞上清液を贅沢に使用した本格フェイシャル",
    category: "facial",
    durationMin: 60,
    price: 17600,
    tags: ["幹細胞", "プレミアム"],
    sortOrder: 5,
  },
  {
    name: "ノンニードル脂肪分解",
    description: "針を使わないノンニードル施術で脂肪分解",
    category: "body",
    durationMin: 60,
    price: 17600,
    tags: ["痩身", "ノンニードル"],
    sortOrder: 10,
  },
  {
    name: "\"引き締め\"脂肪分解",
    description: "脂肪分解と同時に引き締め効果を実現",
    category: "body",
    durationMin: 60,
    price: 19800,
    tags: ["痩身", "引き締め"],
    sortOrder: 11,
  },
  {
    name: "近赤外線ボディケア＋幹細胞導入",
    description: "近赤外線照射によるボディケアと幹細胞導入の組み合わせ",
    category: "relax",
    durationMin: 60,
    price: 15000,
    tags: ["リラクゼーション", "幹細胞"],
    sortOrder: 20,
  },
];

async function seed() {
  console.log("Seeding stores...");
  await db.insert(stores).values(storeData).onConflictDoNothing();

  console.log("Seeding courses...");
  const insertedCourses = await db
    .insert(courses)
    .values(courseData)
    .onConflictDoNothing()
    .returning({ id: courses.id });

  console.log("Seeding store_courses...");
  const storeCoursePairs = storeData.flatMap((store) =>
    insertedCourses.map((course) => ({
      storeId: store.id,
      courseId: course.id,
    }))
  );
  await db.insert(storeCourses).values(storeCoursePairs).onConflictDoNothing();

  console.log("Seed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
