import { z } from "zod";
import type { JobTitle } from "@/domain/catalog";
import { Draft, emptyDraft } from "@/domain/draft";
import { HiringReason } from "@/domain/enums";
import { FIELD_IDS } from "@/domain/fields";
import { ForcedWording, InternalSheet, Posting, SectionCache, type RenderInput } from "@/render/contract";
import { StoredQuickReply } from "./quick-reply-actions";

/** Planner memory across turns: the domain PlannerState plus what the last agent message asked. */
export const PlannerMemory = z.object({
  optionalOffered: z.boolean(),
  /** Fields asked in the last agent message, passed to the extractor. */
  askedFields: z.array(z.enum(FIELD_IDS)),
  /** Hiring reason picked with a quick reply, waiting for the sentence that completes the role mission. */
  pendingHiringReason: HiringReason.nullable(),
  /** Fields asked in the agent message before the last one: a field asked in both is not asked a third time. */
  previousAskedFields: z.array(z.enum(FIELD_IDS)).default([]),
  /** Required fields the user skipped and the agent could not derive; sessions saved before default to none. */
  skipped: z.array(z.enum(FIELD_IDS)).default([]),
  /** Catalog roles the user kept away from when the agent suggested switching: never suggested again. */
  declinedRoles: z.array(z.string()).default([]),
});
export type PlannerMemory = z.infer<typeof PlannerMemory>;

/** Everything a turn reads and writes; one row of the sessions table. */
export const SessionState = z.object({
  draft: Draft,
  planner: PlannerMemory,
  forcedWordings: z.array(ForcedWording),
  sectionCache: SectionCache,
  posting: Posting,
  /** The renderer's internal sheet; null until the first render. */
  sheet: InternalSheet.nullable(),
  quickReplies: z.array(StoredQuickReply),
});
export type SessionState = z.infer<typeof SessionState>;

/** What the renderer reads from the session: a turn that changes none of it needs no new render. */
export function renderInput(state: SessionState): RenderInput {
  return { draft: state.draft, forcedWordings: state.forcedWordings };
}

export function needsRender(before: SessionState, after: SessionState): boolean {
  return JSON.stringify(renderInput(before)) !== JSON.stringify(renderInput(after));
}

/** Shown until the first render: a session whose first message was blocked has no posting yet. */
export const EMPTY_POSTING: Posting = { title: "", summary: [], sections: [] };

export function initialState(): SessionState {
  return {
    draft: emptyDraft(),
    planner: {
      optionalOffered: false,
      askedFields: [],
      pendingHiringReason: null,
      previousAskedFields: [],
      skipped: [],
      declinedRoles: [],
    },
    forcedWordings: [],
    sectionCache: {},
    posting: EMPTY_POSTING,
    sheet: null,
    quickReplies: [],
  };
}

/** A new session: the job title is picked in Home from the catalog, so it starts confirmed. */
export function startState(jobTitle: JobTitle): SessionState {
  const base = initialState();
  const jobTitleSlot = { value: { kind: "catalog" as const, id: jobTitle.id }, source: "user" as const, status: "confirmed" as const };
  return { ...base, draft: { ...base.draft, jobTitle: jobTitleSlot } };
}
