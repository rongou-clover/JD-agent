import { z } from "zod";
import { MAX_INPUT_CHARS } from "@/agents/extractor/schema";
import { Posting } from "@/render/contract";

/** A button under an agent message. The id is opaque and valid only for the session's last agent turn. */
export const QuickReply = z.object({ id: z.string(), label: z.string() });
export type QuickReply = z.infer<typeof QuickReply>;

/** Strings may contain **bold** spans and nothing else. */
export const AgentMessage = z.object({
  text: z.string(),
  /** Numbered questions, at most 2 (docs/domande.md). */
  questions: z.array(z.string()).max(2),
  quickReplies: z.array(QuickReply),
});
export type AgentMessage = z.infer<typeof AgentMessage>;

export const TranscriptEntry = z.discriminatedUnion("role", [
  z.object({ role: z.literal("user"), text: z.string() }),
  z.object({ role: z.literal("agent"), message: AgentMessage }),
]);
export type TranscriptEntry = z.infer<typeof TranscriptEntry>;

export const ChecklistView = z.object({
  items: z.array(z.object({ field: z.string(), label: z.string(), done: z.boolean() })),
  doneCount: z.number().int(),
  totalCount: z.number().int(),
  complete: z.boolean(),
});

/** Everything the chat screen shows: returned by POST /api/chat and GET /api/sessions/[id]. */
export const SessionView = z.object({
  sessionId: z.uuid(),
  transcript: z.array(TranscriptEntry),
  checklist: ChecklistView,
  posting: Posting,
});
export type SessionView = z.infer<typeof SessionView>;

/** One past chat in the Home "Le tue JD" widget. Null title or company: not known yet. */
export const SessionSummary = z.object({
  sessionId: z.uuid(),
  title: z.string().nullable(),
  companyName: z.string().nullable(),
  updatedAt: z.iso.datetime(),
  doneCount: z.number().int(),
  totalCount: z.number().int(),
  complete: z.boolean(),
});
export type SessionSummary = z.infer<typeof SessionSummary>;

/** GET /api/sessions: the chats started from this browser, newest first. */
export const SessionList = z.object({ sessions: z.array(SessionSummary) });
export type SessionList = z.infer<typeof SessionList>;

/** POST /api/chat. A null sessionId starts a new session (the Home "Inizia" button). */
export const ChatRequest = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("message"), sessionId: z.uuid().nullable(), text: z.string().trim().min(1).max(MAX_INPUT_CHARS) }),
  z.object({ kind: z.literal("quickReply"), sessionId: z.uuid(), replyId: z.string() }),
]);
export type ChatRequest = z.infer<typeof ChatRequest>;

/** POST /api/login sets a signed session cookie. */
export const LoginRequest = z.object({ password: z.string().min(1) });

export const API_ERROR_CODES = ["unauthorized", "invalidRequest", "sessionNotFound", "sessionBusy", "budgetExhausted", "internal"] as const;

/** Every non-2xx response. `message` is Italian copy the UI shows as is. */
export const ApiError = z.object({ error: z.enum(API_ERROR_CODES), message: z.string() });
export type ApiError = z.infer<typeof ApiError>;
