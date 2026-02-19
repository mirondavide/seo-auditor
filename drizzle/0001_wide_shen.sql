ALTER TABLE "subscriptions" ADD COLUMN "plan_tier" text DEFAULT 'pro' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "brand_logo_url" text;