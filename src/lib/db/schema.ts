import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  jsonb,
  timestamp,
  date,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export type BusinessHours = {
  mon?: string[];
  tue?: string[];
  wed?: string[];
  thu?: string[];
  fri?: string[];
  sat?: string[];
  sun?: string[];
  slot_interval_min: number;
};

export const stores = pgTable("stores", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  nearestStation: text("nearest_station"),
  timezone: text("timezone").notNull().default("Asia/Tokyo"),
  calendarId: text("calendar_id").notNull(),
  businessHours: jsonb("business_hours").$type<BusinessHours>().notNull(),
  slotIntervalMin: integer("slot_interval_min").notNull().default(30),
  bufferMin: integer("buffer_min").notNull().default(30),
  lastAcceptMinBeforeClose: integer("last_accept_min_before_close")
    .notNull()
    .default(90),
  advanceBookingDays: integer("advance_booking_days").notNull().default(60),
  closedOnHolidays: boolean("closed_on_holidays").notNull().default(false),
  isActive: boolean("is_active").default(true),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  durationMin: integer("duration_min").notNull(),
  price: integer("price").notNull(),
  memberPrice: integer("member_price"),
  tags: text("tags").array(),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
});

export const storeCourses = pgTable(
  "store_courses",
  {
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id),
    courseId: integer("course_id")
      .notNull()
      .references(() => courses.id),
  },
  (table) => [primaryKey({ columns: [table.storeId, table.courseId] })]
);

export const storeHolidays = pgTable(
  "store_holidays",
  {
    id: serial("id").primaryKey(),
    storeId: text("store_id")
      .notNull()
      .references(() => stores.id),
    date: date("date").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("store_holidays_store_date_uq").on(table.storeId, table.date),
  ]
);

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  storeId: text("store_id").references(() => stores.id),
  courseId: integer("course_id").references(() => courses.id),
  email: text("email").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  note: text("note"),
  bookedAt: timestamp("booked_at", { withTimezone: true }).notNull(),
  calendarEventId: text("calendar_event_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
