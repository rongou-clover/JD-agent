import { Agent } from "@mastra/core/agent";
import { anthropicOptions, model } from "../models";
import { loadPrompt } from "../prompt";
import { toUsage } from "../usage";
import { RendererLlmOutput, SectionRequest, toWrittenBlocks, type WriteSection } from "./schema";

export const rendererAgent = new Agent({
  id: "renderer",
  name: "Renderer",
  instructions: loadPrompt("renderer"),
  model: () => model("writer"),
});

/** One model call per section. An unparsable answer comes back empty and fails the output guard. */
export const writeSection: WriteSection = async (raw) => {
  const request = SectionRequest.parse(raw);
  const result = await rendererAgent.generate(JSON.stringify(request), {
    structuredOutput: { schema: RendererLlmOutput },
    providerOptions: anthropicOptions("medium"),
  });
  const parsed = RendererLlmOutput.safeParse(result.object);
  return { output: parsed.success ? toWrittenBlocks(parsed.data) : [], usage: [toUsage(model("writer"), result.usage)] };
};
