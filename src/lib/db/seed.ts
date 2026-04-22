import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { stores, courses, storeCourses, bookings } from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const EMPTY_HOURS = {
  mon: [],
  tue: [],
  wed: [],
  thu: [],
  fri: [],
  sat: [],
  sun: [],
  slot_interval_min: 30,
};

const storeData = [
  {
    id: "shin-kobe",
    name: "C5med Beauty 新神戸店",
    address: "兵庫県神戸市中央区",
    phone: null,
    nearestStation: null,
    timezone: "Asia/Tokyo",
    calendarId:
      "5949a8cbdc44878030d3660d4a42a545c660d64bd5c63ccb21ac6d08e9111cd8@group.calendar.google.com",
    businessHours: EMPTY_HOURS,
    slotIntervalMin: 30,
    bufferMin: 30,
    lastAcceptMinBeforeClose: 90,
    advanceBookingDays: 60,
    closedOnHolidays: true,
  },
  {
    id: "sapporo-nishi11",
    name: "C5med Beauty 札幌西11丁目店",
    address:
      "北海道札幌市中央区南4条西13丁目1-38 サンコート南4条 501号室",
    phone: "080-3907-5708",
    nearestStation: "市電「西11丁目」停留所 徒歩10分",
    timezone: "Asia/Tokyo",
    calendarId:
      "65610c0322ae762efa23b4130f3a9a3fdb43baa00d18a912be672c4aed15ac95@group.calendar.google.com",
    businessHours: {
      mon: ["10:00-18:00"],
      tue: ["10:00-18:00"],
      wed: ["10:00-18:00"],
      thu: ["10:00-18:00"],
      fri: ["10:00-18:00"],
      sat: [],
      sun: [],
      slot_interval_min: 30,
    },
    slotIntervalMin: 30,
    bufferMin: 30,
    lastAcceptMinBeforeClose: 90,
    advanceBookingDays: 60,
    closedOnHolidays: true,
  },
  {
    id: "sapporo-kita2",
    name: "C5med Beauty 札幌北2条店",
    address: "北海道札幌市中央区北2条",
    phone: null,
    nearestStation: null,
    timezone: "Asia/Tokyo",
    calendarId:
      "4463588576869cfe54c0c1076e98816d9e7e45271f7c20ee53d78dd0c7eed054@group.calendar.google.com",
    businessHours: EMPTY_HOURS,
    slotIntervalMin: 30,
    bufferMin: 30,
    lastAcceptMinBeforeClose: 90,
    advanceBookingDays: 60,
    closedOnHolidays: true,
  },
  {
    id: "nagoya-hilton",
    name: "C5med Beauty 名古屋ヒルトンプラザ店",
    address:
      "愛知県名古屋市中区栄1丁目3-3 名古屋ヒルトンプラザ 地下1階",
    phone: "080-3377-5705",
    nearestStation: "地下鉄鶴舞線「伏見駅」 徒歩5分",
    timezone: "Asia/Tokyo",
    calendarId:
      "a08ef7bb32ffa1532b257cbe820338bc1d1c1630c046d23beb362e3b65298997@group.calendar.google.com",
    businessHours: {
      mon: ["10:00-19:00"],
      tue: [],
      wed: ["10:00-19:00"],
      thu: ["10:00-19:00"],
      fri: ["10:00-19:00"],
      sat: ["10:00-19:00"],
      sun: [],
      slot_interval_min: 30,
    },
    slotIntervalMin: 30,
    bufferMin: 30,
    lastAcceptMinBeforeClose: 90,
    advanceBookingDays: 60,
    closedOnHolidays: true,
  },
  {
    id: "kyoto",
    name: "C5med Beauty 京都店",
    address: "京都府京都市中京区",
    phone: null,
    nearestStation: null,
    timezone: "Asia/Tokyo",
    calendarId:
      "ed7390c5164439e167e201361ddb9333fafeaaecb502dfd2b61bdfc33542251a@group.calendar.google.com",
    businessHours: EMPTY_HOURS,
    slotIntervalMin: 30,
    bufferMin: 30,
    lastAcceptMinBeforeClose: 90,
    advanceBookingDays: 60,
    closedOnHolidays: true,
  },
  {
    id: "shimbashi",
    name: "C5med Beauty 新橋店",
    address: "東京都港区新橋4-9 新橋プラザビル 1208",
    phone: "090-1341-5704",
    nearestStation: "JR「新橋駅」烏森口 徒歩3分",
    timezone: "Asia/Tokyo",
    calendarId:
      "e644b570682a99c2dac93cbba2e669218cf24deda234255b2b8a158f565c54a8@group.calendar.google.com",
    businessHours: {
      mon: ["10:00-19:00"],
      tue: [],
      wed: ["10:00-19:00"],
      thu: ["10:00-19:00"],
      fri: ["10:00-19:00"],
      sat: ["10:00-19:00"],
      sun: [],
      slot_interval_min: 30,
    },
    slotIntervalMin: 30,
    bufferMin: 30,
    lastAcceptMinBeforeClose: 90,
    advanceBookingDays: 60,
    closedOnHolidays: true,
  },
  {
    id: "fukuoka-c5clinic",
    name: "C5med Beauty 福岡 C5クリニック内",
    address: "福岡県福岡市中央区",
    phone: null,
    nearestStation: null,
    timezone: "Asia/Tokyo",
    calendarId:
      "dd1e679dfe4a618e5bf5d21cc367dad62ea40cf2f288074652f698894064b8d1@group.calendar.google.com",
    businessHours: EMPTY_HOURS,
    slotIntervalMin: 30,
    bufferMin: 30,
    lastAcceptMinBeforeClose: 90,
    advanceBookingDays: 60,
    closedOnHolidays: true,
  },
];

const JOSEI_NOTE = "※上清液あり ＋6,600円";

const courseData = [
  {
    name: "近赤フォトフェイシャル 上清液導入",
    description: "近赤外線と音響振動で上清液を深部まで届ける",
    category: "facial",
    durationMin: 45,
    price: 13200,
    memberPrice: 13200,
    tags: ["保湿", "シワ", "たるみ", "毛穴", "シミ"],
    sortOrder: 1,
  },
  {
    name: "針ナシ注射(ノンニードル)リフトアップ",
    description: `針を使わないノンニードル施術でリフトアップ\n${JOSEI_NOTE}`,
    category: "facial",
    durationMin: 45,
    price: 27500,
    memberPrice: 19800,
    tags: ["リフトアップ"],
    sortOrder: 2,
  },
  {
    name: "針ナシ注射(ノンニードル)赤み／ニキビ跡",
    description: `針を使わないノンニードル施術で炎症軽減\n${JOSEI_NOTE}`,
    category: "facial",
    durationMin: 45,
    price: 27500,
    memberPrice: 19800,
    tags: ["赤み", "ニキビ"],
    sortOrder: 3,
  },
  {
    name: "針ナシ注射(ノンニードル)ホワイトニング",
    description: `針を使わないノンニードル施術で美白\n${JOSEI_NOTE}`,
    category: "facial",
    durationMin: 45,
    price: 27500,
    memberPrice: 19800,
    tags: ["美白", "シミ"],
    sortOrder: 4,
  },
  {
    name: "針ナシ注射(ノンニードル)潤い／ツヤ",
    description: `針を使わないノンニードル施術で潤い肌へ\n${JOSEI_NOTE}`,
    category: "facial",
    durationMin: 45,
    price: 27500,
    memberPrice: 23100,
    tags: ["保湿", "ツヤ肌"],
    sortOrder: 5,
  },
  {
    name: "トータルフェイシャル(針ナシ注射＋上清液＋近赤)リフトアップ",
    description: "ノンニードル施術と近赤外線のWでリフトアップへ",
    category: "facial",
    durationMin: 75,
    price: 35200,
    memberPrice: 28600,
    tags: ["リフトアップ"],
    sortOrder: 10,
  },
  {
    name: "トータルフェイシャル(針ナシ注射＋上清液＋近赤)赤み／ニキビ跡",
    description: "ノンニードル施術と近赤外線のWで炎症軽減",
    category: "facial",
    durationMin: 75,
    price: 35200,
    memberPrice: 28600,
    tags: ["赤み", "ニキビ"],
    sortOrder: 11,
  },
  {
    name: "トータルフェイシャル(針ナシ注射＋上清液＋近赤)ホワイトニング",
    description: "ノンニードル施術と近赤外線のWで美白",
    category: "facial",
    durationMin: 75,
    price: 35200,
    memberPrice: 28600,
    tags: ["美白", "シミ"],
    sortOrder: 12,
  },
  {
    name: "トータルフェイシャル(針ナシ注射＋上清液＋近赤)潤い／ツヤ",
    description: "ノンニードル施術と近赤外線のWでツヤ肌へ",
    category: "facial",
    durationMin: 75,
    price: 38500,
    memberPrice: 31900,
    tags: ["保湿", "ツヤ肌"],
    sortOrder: 13,
  },
  {
    name: "プレミアムフェイシャル(全身リンパケア＋針ナシ注射＋上清液＋近赤)リフトアップ",
    description:
      "血流140％UPで細胞や血流の老化を防ぎつつ、ノンニードル施術と近赤外線でリフトアップへ",
    category: "premium",
    durationMin: 90,
    price: 38500,
    memberPrice: 33000,
    tags: ["リフトアップ", "全身"],
    sortOrder: 20,
  },
  {
    name: "プレミアムフェイシャル(全身リンパケア＋針ナシ注射＋上清液＋近赤)赤み／ニキビ跡",
    description:
      "血流140％UPで細胞や血流の老化を防ぎつつ、ノンニードル施術と近赤外線で炎症軽減",
    category: "premium",
    durationMin: 90,
    price: 38500,
    memberPrice: 33000,
    tags: ["赤み", "ニキビ", "全身"],
    sortOrder: 21,
  },
  {
    name: "プレミアムフェイシャル(全身リンパケア＋針ナシ注射＋上清液＋近赤)ホワイトニング",
    description:
      "血流140％UPで細胞や血流の老化を防ぎつつ、ノンニードル施術と近赤外線で美白",
    category: "premium",
    durationMin: 90,
    price: 38500,
    memberPrice: 33000,
    tags: ["美白", "シミ", "全身"],
    sortOrder: 22,
  },
  {
    name: "プレミアムフェイシャル(全身リンパケア＋針ナシ注射＋上清液＋近赤)潤い／ツヤ",
    description:
      "血流140％UPで細胞や血流の老化を防ぎつつ、ノンニードル施術と近赤外線でツヤ肌",
    category: "premium",
    durationMin: 90,
    price: 41800,
    memberPrice: 36300,
    tags: ["保湿", "ツヤ肌", "全身"],
    sortOrder: 23,
  },
  {
    name: "ペインケア(ノンニードル)肩こり／腰痛／膝痛",
    description: `血管拡張作用による血流改善、筋弛緩と炎症抑制成分をノンニードルで\n${JOSEI_NOTE}`,
    category: "body",
    durationMin: 75,
    price: 27500,
    memberPrice: 19800,
    tags: ["慢性疼痛", "コリ"],
    sortOrder: 30,
  },
  {
    name: "痩身(ノンニードル)",
    description: `血管拡張作用による脂肪代謝促進、ノンニードルで脂肪分解、引き締めへ\n${JOSEI_NOTE}`,
    category: "body",
    durationMin: 75,
    price: 39600,
    memberPrice: 19800,
    tags: ["痩身", "引き締め", "ノンニードル"],
    sortOrder: 31,
  },
  {
    name: "アイケア 眼精疲労／老眼 上清液使用",
    description:
      "目の周りの滞った血流を流すことで、眼精疲労の原因物質を排出し、上清液の修復力を高める",
    category: "eye",
    durationMin: 30,
    price: 9900,
    memberPrice: 9900,
    tags: ["眼精疲労"],
    sortOrder: 40,
  },
  {
    name: "ブレインケア 上清液使用",
    description:
      "血流が良くなることで、脳細胞への酸素や栄養素の供給がスムーズになり脳の疲れの解消や、集中力のリフレッシュ",
    category: "head",
    durationMin: 45,
    price: 15400,
    memberPrice: 15400,
    tags: ["脳の疲れ", "リフレッシュ"],
    sortOrder: 50,
  },
  {
    name: "フェミニンケア 妊活／生理痛／更年期症状 上清液使用",
    description:
      "近赤外線で膣周辺の深部体温を上げ、血管を拡張させることで冷えの改善や生理痛の緩和、pHバランスを整えることで、ニオイや不快感の軽減",
    category: "body",
    durationMin: 30,
    price: 11000,
    memberPrice: 11000,
    tags: ["冷え", "生理痛", "更年期", "妊活"],
    sortOrder: 60,
  },
  {
    name: "スカルプケア 上清液使用 発毛／育毛／薄毛",
    description:
      "血流改善とノンニードル栄養供給のダブルパンチで、育毛・発毛を強力にサポート",
    category: "head",
    durationMin: 60,
    price: 33000,
    memberPrice: 26400,
    tags: ["発毛", "育毛", "薄毛"],
    sortOrder: 51,
  },
];

// Stores that have confirmed business hours & course offerings from the spreadsheet.
const STORES_WITH_COURSES = new Set([
  "sapporo-nishi11",
  "nagoya-hilton",
  "shimbashi",
]);

async function seed() {
  console.log(
    "Clearing store_courses, courses, stores (bookings preserved, FKs set to NULL)..."
  );
  // bookings は保持しつつ、FKを一旦 NULL に戻して参照を切る
  await db.update(bookings).set({ courseId: null, storeId: null });
  await db.delete(storeCourses);
  await db.delete(courses);
  await db.delete(stores);

  console.log("Inserting stores...");
  await db.insert(stores).values(storeData);

  console.log("Inserting courses...");
  const insertedCourses = await db
    .insert(courses)
    .values(courseData)
    .returning({ id: courses.id });
  console.log(`  inserted ${insertedCourses.length} courses`);

  console.log("Inserting store_courses (3 stores × 19 courses)...");
  const storeCoursePairs = storeData
    .filter((s) => STORES_WITH_COURSES.has(s.id))
    .flatMap((store) =>
      insertedCourses.map((course) => ({
        storeId: store.id,
        courseId: course.id,
      }))
    );
  await db.insert(storeCourses).values(storeCoursePairs);
  console.log(`  inserted ${storeCoursePairs.length} store_course rows`);

  console.log("Seed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
