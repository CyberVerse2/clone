ALTER TABLE "proxies" ADD COLUMN IF NOT EXISTS "ens_name" varchar(255);
ALTER TABLE "proxies" ADD COLUMN IF NOT EXISTS "ens_node" varchar(66);
ALTER TABLE "proxies" ADD COLUMN IF NOT EXISTS "ens_owner_address" varchar(42);
ALTER TABLE "proxies" ADD COLUMN IF NOT EXISTS "ens_resolved_address" varchar(42);
ALTER TABLE "proxies" ADD COLUMN IF NOT EXISTS "ens_avatar_url" text;
ALTER TABLE "proxies" ADD COLUMN IF NOT EXISTS "ens_description" text;
ALTER TABLE "proxies" ADD COLUMN IF NOT EXISTS "ens_text_records" jsonb;
ALTER TABLE "proxies" ADD COLUMN IF NOT EXISTS "ens_registration_status" varchar(24);
ALTER TABLE "proxies" ADD COLUMN IF NOT EXISTS "ens_verified_at" timestamp;

CREATE UNIQUE INDEX IF NOT EXISTS "proxies_ens_name_unique" ON "proxies" ("ens_name");
CREATE INDEX IF NOT EXISTS "idx_proxies_ens_name" ON "proxies" ("ens_name");
