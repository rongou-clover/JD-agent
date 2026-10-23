import { z } from "zod";
import { Diagnosis } from "@/domain/diagnosis";

export const PROMPT_VERSION = "role-diagnosis@5";

/** At most: list, inspect two candidates, answer. */
export const MAX_STEPS = 4;

export const DiagnosisInput = z.object({
  /** The user's description of the role, possibly a pasted posting. */
  message: z.string().min(1),
});
export type DiagnosisInput = z.infer<typeof DiagnosisInput>;

export const DiagnosisOutput = Diagnosis;
export type DiagnosisOutput = z.infer<typeof DiagnosisOutput>;
