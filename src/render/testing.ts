import type { SectionRequest, WriteSection } from "@/agents/renderer/schema";
import type { WrittenBlock } from "./guard";

/** Test helper: a valid section for any request, with the forced wording verbatim. */
export function fakeBlocks(request: SectionRequest): WrittenBlock[] {
  const words = request.bounds.targetWords;
  const text = `${Array.from({ length: words }, () => "parola").join(" ")}.`;
  const forced: WrittenBlock[] = request.forcedWording ? [{ kind: "paragraph", text: request.forcedWording }] : [];
  return [...forced, { kind: "paragraph", text }];
}

/** Test helper: a writer that records its requests and answers with `answer` (default: fakeBlocks). */
export function fakeWriter(answer: (request: SectionRequest) => WrittenBlock[] = fakeBlocks) {
  const requests: SectionRequest[] = [];
  const write: WriteSection = async (request) => {
    requests.push(request);
    return { output: answer(request), usage: [{ model: "fake", inputTokens: 100, outputTokens: 10 }] };
  };
  return { write, requests };
}
