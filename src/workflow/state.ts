import { z } from "zod";
import { Diagnosis } from "@/domain/diagnosis";
import { Draft, emptyDraft } from "@/domain/draft";
import { HiringReason } from "@/domain/enums";
import { FIELD_IDS } from "@/domain/fields";
import { ForcedWording, InternalSheet, Posting, SectionCache } from "@/render/contract";
import { StoredQuickReply } from "./quick-reply-actions";

/** Planner memory across turns: the domain PlannerState plus what the last agent message asked. */
export const PlannerMemory = z.object({
  optionalOffered: z.boolean(),
  /** Fields asked in the last agent message, passed to the extractor. */
  askedFields: z.array(z.enum(FIELD_IDS)),
  /** Hiring reason picked with a quick reply, waiting for the sentence that completes the role mission. */
  pendingHiringReason: HiringReason.nullable(),
});
export type PlannerMemory = z.infer<typeof PlannerMemory>;

/** Everything a turn reads and writes; one row of the sessions table. */
export const SessionState = z.object({
  draft: Draft,
  diagnosis: Diagnosis.nullable(),
  planner: PlannerMemory,
  forcedWordings: z.array(ForcedWording),
  sectionCache: SectionCache,
  posting: Posting,
  /** The renderer's internal sheet; null until the first render. */
  sheet: InternalSheet.nullable(),
  quickReplies: z.array(StoredQuickReply),
});
export type SessionState = z.infer<typeof SessionState>;

/** Shown until the first render: a session whose first message was blocked has no posting yet. */
export const EMPTY_POSTING: Posting = { title: "", summary: [], sections: [] };

export function initialState(): SessionState {
  return {
    draft: emptyDraft(),
    diagnosis: null,
    planner: { optionalOffered: false, askedFields: [], pendingHiringReason: null },
    forcedWordings: [],
    sectionCache: {},
    posting: EMPTY_POSTING,
    sheet: null,
    quickReplies: [],
  };
}
