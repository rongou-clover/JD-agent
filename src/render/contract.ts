import { z } from "zod";
import type { AgentResult } from "@/agents/usage";
import { Diagnosis } from "@/domain/diagnosis";
import { Draft } from "@/domain/draft";
import { Criticality, ExpectedLevel, Seniority, SkillType } from "@/domain/enums";

/** Posting sections in template order (docs/template-output.md); "summary" is the box at the top. */
export const SECTION_IDS = [
  "summary",
  "role",
  "team",
  "activities",
  "results",
  "requirements",
  "niceToHave",
  "howYouWork",
  "offer",
  "practicalInfo",
  "selectionProcess",
  "about",
  "missionValues",
  "equalOpportunity",
] as const;
export const SectionId = z.enum(SECTION_IDS);
export type SectionId = z.infer<typeof SectionId>;

/** A placeholder stands for a required field still missing: shown as "[Da definire in chat]". */
export const PostingBlock = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("paragraph"), text: z.string() }),
  z.object({ kind: z.literal("bullets"), items: z.array(z.string()).min(1) }),
  z.object({ kind: z.literal("placeholder") }),
]);
export type PostingBlock = z.infer<typeof PostingBlock>;

export const PostingSection = z.object({ id: SectionId, heading: z.string(), blocks: z.array(PostingBlock).min(1) });
export type PostingSection = z.infer<typeof PostingSection>;

/** One "key: value" line of the summary box; a null value is a placeholder. */
export const SummaryRow = z.object({ label: z.string(), value: z.string().nullable() });

/** The posting as published. Sections without data are omitted; order follows SECTION_IDS. */
export const Posting = z.object({
  title: z.string(),
  summary: z.array(SummaryRow),
  sections: z.array(PostingSection),
});
export type Posting = z.infer<typeof Posting>;

/** Never published: for the hiring team only. */
export const InternalSheet = z.object({
  jobTitle: z.string(),
  seniority: Seniority.nullable(),
  inCatalog: z.boolean(),
  /** Set when no role prevails: a hard-to-fill profile. */
  hybridRoles: z.array(z.string()).nullable(),
  skills: z.array(
    z.object({
      name: z.string(),
      type: SkillType.nullable(),
      criticality: Criticality.nullable(),
      expectedLevel: ExpectedLevel.nullable(),
      required: z.boolean(),
      /** "draft": named by the user; "catalog": expected for the role but not cited in the draft. */
      source: z.enum(["draft", "catalog"]),
    }),
  ),
  softSkills: z.array(z.string()),
  prerequisites: z.array(z.string()),
  salary: z.object({ min: z.number().int(), max: z.number().int(), inPosting: z.boolean() }).nullable(),
  managerNotes: z.string().nullable(),
  recommendedDimensions: z.array(z.string()),
});
export type InternalSheet = z.infer<typeof InternalSheet>;

/** Sections written in prose; the summary box and the equal opportunity text are fixed code. */
export const PROSE_SECTION_IDS = SECTION_IDS.filter(
  (id): id is Exclude<SectionId, "summary" | "equalOpportunity"> => id !== "summary" && id !== "equalOpportunity",
);
export const ProseSectionId = z.enum(PROSE_SECTION_IDS);

/** Exact text the user dictated for one prose section; it wins over the generated text. */
export const ForcedWording = z.object({ section: ProseSectionId, text: z.string().min(1) });
export type ForcedWording = z.infer<typeof ForcedWording>;

export const RenderInput = z.object({
  draft: Draft,
  diagnosis: Diagnosis.nullable(),
  forcedWordings: z.array(ForcedWording),
});
export type RenderInput = z.infer<typeof RenderInput>;

/**
 * Rendered sections from the previous turn, stored with the session.
 * A section is regenerated only when its hash (dependency fields, forced wordings, prompt version) changes.
 */
export const SectionCache = z.partialRecord(SectionId, z.object({ hash: z.string(), section: PostingSection }));
export type SectionCache = z.infer<typeof SectionCache>;

export const RenderOutput = z.object({ posting: Posting, sheet: InternalSheet, cache: SectionCache });
export type RenderOutput = z.infer<typeof RenderOutput>;

/** Implemented by src/render (stream A), called by the workflow (stream B). */
export type Render = (input: RenderInput, cache: SectionCache) => Promise<AgentResult<RenderOutput>>;
