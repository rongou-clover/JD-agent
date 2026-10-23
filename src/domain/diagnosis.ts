import { z } from "zod";
import { Seniority } from "./enums";

/** Key activities of the request that belong to another catalog role; they stay in the main role. */
export const OtherRole = z.object({ jobTitleId: z.string(), activities: z.array(z.string()).min(1) });
export type OtherRole = z.infer<typeof OtherRole>;

/** Output contract of the role-diagnosis agent (docs/domande.md, "Primo messaggio"). */
export const Diagnosis = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("catalog"),
    /** The main role: the one that owns the activities the user cares about most. */
    jobTitleId: z.string(),
    seniority: Seniority,
    otherRoles: z.array(OtherRole),
    /** No role prevails: a hard-to-fill profile, flagged to the user and in the internal sheet. */
    hybrid: z.boolean(),
  }),
  z.object({ kind: z.literal("outOfCatalog"), title: z.string() }),
]);

export type Diagnosis = z.infer<typeof Diagnosis>;
