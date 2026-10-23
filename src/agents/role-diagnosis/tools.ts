import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { catalog, findJobTitle } from "@/domain/catalog";

export const listJobTitles = createTool({
  id: "list-job-titles",
  description: "List every job title in the GTM catalog with family, aliases and allowed seniority levels.",
  inputSchema: z.object({}),
  execute: async () => ({
    seniority: catalog.seniority,
    jobTitles: catalog.jobTitles.map(({ id, family, name, aliases, seniority }) => ({ id, family, name, aliases, seniority })),
  }),
});

export const getJobTitle = createTool({
  id: "get-job-title",
  description: "Get one catalog job title with its skills and expected level per seniority.",
  inputSchema: z.object({ id: z.string().describe("Catalog id from list-job-titles") }),
  execute: async ({ id }) => findJobTitle(id) ?? { error: `Unknown job title id: ${id}` },
});
