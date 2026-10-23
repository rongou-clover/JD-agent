import type { AgentMessage } from "@/api/contract";
import type { ExtractorInput, ExtractorOutput } from "@/agents/extractor/schema";
import type { GuardResult } from "@/agents/prompt-injection/guard";
import type { DiagnosisInput } from "@/agents/role-diagnosis/schema";
import type { AgentResult, Usage } from "@/agents/usage";
import type { Diagnosis } from "@/domain/diagnosis";
import type { Plan } from "@/domain/planner";
import type { Render } from "@/render/contract";
import type { QuickReplyAction } from "./quick-reply-actions";
import type { SessionState } from "./state";

/** What the agent message leads with: the planner's next step, the role proposal, or the "what is missing" reminder. */
export const FOCUSES = ["plan", "diagnosis", "completeAnyway"] as const;
export type Focus = (typeof FOCUSES)[number];

export type TurnInput =
  | { kind: "message"; text: string }
  | { kind: "quickReply"; label: string; action: QuickReplyAction };

/** Everything a turn calls outside plain code; injected so tests use fakes. */
export type TurnDeps = {
  checkMessage: (text: string) => Promise<GuardResult>;
  extract: (input: ExtractorInput) => Promise<AgentResult<ExtractorOutput>>;
  diagnose: (input: DiagnosisInput) => Promise<AgentResult<Diagnosis>>;
  render: Render;
  /** Model id the guard runs on, for its usage estimate. */
  guardModel: () => string;
  /** Opaque id for a quick reply. */
  newReplyId: () => string;
};

/** Carried through every workflow step; each step reads it and returns an updated copy. */
export type TurnContext = {
  input: TurnInput;
  state: SessionState;
  usage: Usage[];
  /** Lines the agent message starts with (notices, explanations). */
  notes: string[];
  focus: Focus;
  extraction: ExtractorOutput | null;
  /** Diagnosis produced in this turn, if the role-diagnosis agent ran. */
  diagnosis: Diagnosis | null;
  plan: Plan | null;
  message: AgentMessage | null;
};

/** The turn result: the new session state and the agent's reply. */
export type TurnOutcome = { state: SessionState; message: AgentMessage; usage: Usage[] };
