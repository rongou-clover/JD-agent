import { z } from "zod";
import { QuickReply } from "@/api/contract";
import { ContractType, HiringReason, Seniority, WorkMode } from "@/domain/enums";

/** What a quick reply does when clicked; handled in code, never by an LLM. */
export const QuickReplyAction = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("confirmRole") }),
  z.object({ kind: z.literal("seniorityDown") }),
  z.object({ kind: z.literal("seniorityUp") }),
  z.object({ kind: z.literal("chooseOtherRole") }),
  z.object({ kind: z.literal("pickRole"), jobTitleId: z.string() }),
  z.object({ kind: z.literal("pickSeniority"), seniority: Seniority }),
  z.object({ kind: z.literal("hiringReason"), reason: HiringReason }),
  z.object({ kind: z.literal("workMode"), mode: WorkMode }),
  z.object({ kind: z.literal("contractType"), type: ContractType }),
  z.object({ kind: z.literal("softSkill"), name: z.string() }),
]);
export type QuickReplyAction = z.infer<typeof QuickReplyAction>;

/** A quick reply before it gets its opaque id. */
export type ReplyOption = { label: string; action: QuickReplyAction };

/** A quick reply as stored on the session: the id the UI sends back, and what it does. */
export const StoredQuickReply = QuickReply.extend({ action: QuickReplyAction });
export type StoredQuickReply = z.infer<typeof StoredQuickReply>;
