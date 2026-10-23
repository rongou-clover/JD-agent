import { Agent } from "@mastra/core/agent";
import { FIELD_IDS } from "@/domain/fields";
import { anthropicOptions, model } from "../models";
import { loadPrompt } from "../prompt";
import { toUsage, type AgentResult } from "../usage";
import { ExtractorLlmOutput, toExtractorOutput } from "./llm-output";
import { ExtractorInput, type ExtractorOutput } from "./schema";

export const extractorAgent = new Agent({
  id: "extractor",
  name: "Extractor",
  instructions: loadPrompt("extractor"),
  model: () => model("fast"),
});

function draftValues(input: ExtractorInput) {
  return Object.fromEntries(FIELD_IDS.map((id) => [id, input.draft[id].value]));
}

export async function extract(raw: ExtractorInput): Promise<AgentResult<ExtractorOutput>> {
  const input = ExtractorInput.parse(raw);
  const prompt = JSON.stringify({
    message: input.message,
    draft: draftValues(input),
    askedFields: input.askedFields,
    lastAskFields: input.lastAskFields,
  });
  const result = await extractorAgent.generate(prompt, {
    structuredOutput: { schema: ExtractorLlmOutput, jsonPromptInjection: true },
    providerOptions: anthropicOptions("low"),
  });
  const output = toExtractorOutput(ExtractorLlmOutput.parse(result.object));
  return { output, usage: [toUsage(model("fast"), result.usage)] };
}
