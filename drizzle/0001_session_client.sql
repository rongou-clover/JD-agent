ALTER TABLE "sessions" ADD COLUMN "client_id" uuid;--> statement-breakpoint
CREATE INDEX "sessions_client_id_idx" ON "sessions" USING btree ("client_id","updated_at");