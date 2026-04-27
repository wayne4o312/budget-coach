CREATE TABLE "quick_add_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"position" integer NOT NULL,
	"kind" text NOT NULL,
	"scene_id" text,
	"custom_title" text,
	"custom_category" text,
	"custom_icon" text,
	"suggested_amounts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'CNY' NOT NULL,
	"category" text NOT NULL,
	"scene" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"note" text,
	"deleted_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_transactions_user_time" ON "transactions" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "idx_transactions_updated" ON "transactions" USING btree ("updated_at");