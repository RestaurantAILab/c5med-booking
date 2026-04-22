CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" text,
	"course_id" integer,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"note" text,
	"booked_at" timestamp with time zone NOT NULL,
	"calendar_event_id" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"duration_min" integer NOT NULL,
	"price" integer NOT NULL,
	"member_price" integer,
	"tags" text[],
	"image_url" text,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "store_courses" (
	"store_id" text NOT NULL,
	"course_id" integer NOT NULL,
	CONSTRAINT "store_courses_store_id_course_id_pk" PRIMARY KEY("store_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "store_holidays" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"date" date NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"phone" text,
	"nearest_station" text,
	"timezone" text DEFAULT 'Asia/Tokyo' NOT NULL,
	"calendar_id" text NOT NULL,
	"business_hours" jsonb NOT NULL,
	"slot_interval_min" integer DEFAULT 30 NOT NULL,
	"buffer_min" integer DEFAULT 30 NOT NULL,
	"last_accept_min_before_close" integer DEFAULT 90 NOT NULL,
	"advance_booking_days" integer DEFAULT 60 NOT NULL,
	"closed_on_holidays" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_courses" ADD CONSTRAINT "store_courses_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_courses" ADD CONSTRAINT "store_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_holidays" ADD CONSTRAINT "store_holidays_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "store_holidays_store_date_uq" ON "store_holidays" USING btree ("store_id","date");