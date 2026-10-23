import type { Diagnosis } from "@/domain/diagnosis";
import type { Draft } from "@/domain/draft";
import type { ForcedWording } from "@/render/contract";
import { applyDiagnosis, applyExtraction } from "./merge";
import { applySkipped, repeatedAsks } from "./skipped";
import type { PlannerMemory } from "./state";
import { COPY, discriminationNote } from "./templates/copy";
import { fieldLabels } from "./templates/format";
import type { Focus, TurnContext } from "./turn-context";

/** The diagnosis falls back to an untitled out-of-catalog role when it fails: that one is not applied. */
function isUsable(diagnosis: Diagnosis): boolean {
  return diagnosis.kind === "catalog" || diagnosis.title.trim().length > 0;
}

/** A hiring reason picked with a quick reply wins over the one the extractor guessed. */
function applyPendingReason(draft: Draft, planner: PlannerMemory): { draft: Draft; planner: PlannerMemory } {
  const reason = planner.pendingHiringReason;
  const mission = draft.roleMission.value;
  if (!reason || !mission) return { draft, planner };
  return {
    draft: { ...draft, roleMission: { ...draft.roleMission, value: { ...mission, reason } } },
    planner: { ...planner, pendingHiringReason: null },
  };
}

function upsertWording(wordings: ForcedWording[], wording: ForcedWording): ForcedWording[] {
  return [...wordings.filter((existing) => existing.section !== wording.section), wording];
}

/** Merges what the extractor and the diagnosis found in the user's message into the session state. */
export function mergeMessage(ctx: TurnContext): TurnContext {
  const extraction = ctx.extraction;
  if (!extraction) return ctx;
  const flags = extraction.discriminationFlags;
  const notes = [...ctx.notes, ...flags.map((flag) => discriminationNote(flag.category, flag.quote))];
  if (extraction.intent === "other") return { ...ctx, notes: [...notes, COPY.offTopic] };

  const { draft: extracted, planner } = applyPendingReason(applyExtraction(ctx.state.draft, extraction), ctx.state.planner);
  let draft = extracted;
  let forcedWordings = ctx.state.forcedWordings;
  // A dictated wording always wins, except over the anti-discrimination rules (docs/decisioni.md).
  if (extraction.forcedWording && flags.length === 0) {
    forcedWordings = upsertWording(forcedWordings, extraction.forcedWording);
    notes.push(COPY.forcedWording);
  }

  let focus: Focus = extraction.intent === "completeAnyway" ? "completeAnyway" : ctx.focus;
  let diagnosis = ctx.state.diagnosis;
  if (ctx.diagnosis && isUsable(ctx.diagnosis)) {
    draft = applyDiagnosis(draft, ctx.diagnosis);
    diagnosis = ctx.diagnosis;
    if (ctx.diagnosis.kind === "catalog") focus = "diagnosis";
    else notes.push(COPY.outOfCatalog);
  }
  return { ...ctx, notes, focus, state: { ...ctx.state, draft, diagnosis, planner, forcedWordings } };
}

/**
 * Fields the user skipped, and fields asked twice in a row and still not done, are treated alike:
 * derived ones are announced as proposed, the others are remembered so the planner stops asking.
 */
function mergeSkipped(ctx: TurnContext, before: Draft): TurnContext {
  const { draft, planner } = ctx.state;
  const skipped = [...(ctx.extraction?.skipped ?? []), ...repeatedAsks(planner, draft)];
  const outcome = applySkipped({ draft, before, skipped, askedFields: planner.askedFields });
  const notes = [...ctx.notes];
  if (outcome.proposed.length > 0) notes.push(COPY.proposedOnSkip(fieldLabels(outcome.proposed)));
  if (outcome.leftOpen.length > 0) notes.push(COPY.leftOpen(fieldLabels(outcome.leftOpen)));
  const memory = { ...planner, skipped: [...new Set([...planner.skipped, ...outcome.leftOpen])] };
  return { ...ctx, notes, state: { ...ctx.state, draft: outcome.draft, planner: memory } };
}

/** The merge step: the user's message (if any), then skipped and repeatedly asked fields. */
export function mergeTurn(ctx: TurnContext): TurnContext {
  return mergeSkipped(mergeMessage(ctx), ctx.state.draft);
}
