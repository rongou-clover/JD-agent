import { z } from "zod";
import { ProseSectionId } from "@/render/contract";
import type { WrittenBlock } from "@/render/guard";
import type { AgentResult } from "../usage";

export const PROMPT_VERSION = "renderer@3";

/** Input of one call: one posting section, written from the data the section depends on. */
export const SectionRequest = z.object({
  section: ProseSectionId,
  heading: z.string(),
  data: z.record(z.string(), z.unknown()),
  /** The user's exact text for this section: it must appear verbatim. */
  forcedWording: z.string().nullable(),
  bounds: z.object({
    minWords: z.number().int(),
    targetWords: z.number().int(),
    maxWords: z.number().int(),
    maxBullets: z.number().int(),
  }),
  /** Why the previous attempt was rejected by the output guard; null on the first attempt. */
  retryReason: z.string().nullable(),
});
export type SectionRequest = z.infer<typeof SectionRequest>;

/** Flat block shape for the model: a paragraph uses `text`, a list uses `items`. */
const LlmBlock = z.object({
  kind: z.enum(["paragraph", "bullets"]),
  text: z.string(),
  items: z.array(z.string()),
});

export const RendererLlmOutput = z.object({ blocks: z.array(LlmBlock) });
export type RendererLlmOutput = z.infer<typeof RendererLlmOutput>;

/** Empty paragraphs and lists are dropped; the output guard rejects a section left empty. */
export function toWrittenBlocks(output: RendererLlmOutput): WrittenBlock[] {
  return output.blocks.flatMap((block): WrittenBlock[] => {
    if (block.kind === "paragraph") return block.text.trim() ? [{ kind: "paragraph", text: block.text.trim() }] : [];
    const items = block.items.map((item) => item.trim()).filter((item) => item.length > 0);
    return items.length > 0 ? [{ kind: "bullets", items }] : [];
  });
}

/** Writes one section; injected into the renderer so tests run without the model. */
export type WriteSection = (request: SectionRequest) => Promise<AgentResult<WrittenBlock[]>>;
