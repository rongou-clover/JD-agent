ALTER TABLE "sessions" ADD COLUMN "rendered_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
-- Sessions saved before were rendered inside the turn: their posting is current.
UPDATE "sessions" SET "rendered_version" = "version";
