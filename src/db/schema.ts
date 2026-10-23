import { bigserial, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { MESSAGE_ROLES } from "./enums";

/** One chat. The state is plain JSON validated by the workflow schemas on load (src/workflow/state.ts). */
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Anonymous browser id (client cookie): a browser lists only its own chats. */
    clientId: uuid("client_id"),
    draft: jsonb("draft").notNull(),
    diagnosis: jsonb("diagnosis"),
    plannerState: jsonb("planner_state").notNull(),
    forcedWordings: jsonb("forced_wordings").notNull(),
    sectionCache: jsonb("section_cache").notNull(),
    posting: jsonb("posting").notNull(),
    /** Internal sheet of the last render; null before the first render. */
    sheet: jsonb("sheet"),
    /** Quick replies of the last agent turn, with the action each id stands for. */
    quickReplies: jsonb("quick_replies").notNull(),
    /** Optimistic lock: every saved turn increments it. */
    version: integer("version").notNull().default(1),
    /** Version the posting was rendered for; below `version`, the posting is still being written. */
    renderedVersion: integer("rendered_version").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("sessions_client_id_idx").on(table.clientId, table.updatedAt)],
);

export const messageRole = pgEnum("message_role", MESSAGE_ROLES);

export const messages = pgTable(
  "messages",
  {
    /** Serial id: user and agent messages of one turn share created_at, the id keeps their order. */
    id: bigserial("id", { mode: "number" }).primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    role: messageRole("role").notNull(),
    content: jsonb("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("messages_session_id_idx").on(table.sessionId, table.id)],
);

export const usage = pgTable(
  "usage",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    sessionId: uuid("session_id").references(() => sessions.id, { onDelete: "set null" }),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens").notNull(),
    outputTokens: integer("output_tokens").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("usage_created_at_idx").on(table.createdAt)],
);
