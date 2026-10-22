import { z } from "zod";
import { Seniority } from "./enums";

/** Output contract of the role-diagnosis agent (docs/domande.md, "Primo messaggio"). */
export const Diagnosis = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("single"), jobTitleId: z.string(), seniority: Seniority }),
  z.object({
    kind: z.literal("multiple"),
    /** Catalog ids of every role described, the proposed main one first. */
    candidates: z.array(z.string()).min(2),
    seniority: Seniority,
  }),
  z.object({ kind: z.literal("outOfCatalog"), title: z.string() }),
]);

export type Diagnosis = z.infer<typeof Diagnosis>;
