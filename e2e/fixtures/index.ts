import complete from "./session-complete.json";
import diagnosis from "./session-diagnosis.json";
import questions from "./session-questions.json";

/**
 * SessionView fixtures (Human Maple case from the wireframe), validated against the contract in
 * src/ui/api/fixtures.test.ts:
 * - diagnosis: first turn, role proposal with quick replies;
 * - questions: mid conversation, two numbered questions and placeholders in the posting;
 * - complete: checklist complete, "JD pronta".
 */
export const SESSION_FIXTURES = { diagnosis, questions, complete } as const;

export const FIXTURE_SESSION_ID = diagnosis.sessionId;
