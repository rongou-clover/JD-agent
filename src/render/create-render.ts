import type { WriteSection } from "@/agents/renderer/schema";
import type { Usage } from "@/agents/usage";
import type { Diagnosis } from "@/domain/diagnosis";
import type { Draft } from "@/domain/draft";
import { sectionHash, type HashInput } from "./cache";
import {
  PROSE_SECTION_IDS,
  RenderInput,
  type ForcedWording,
  type PostingBlock,
  type PostingSection,
  type Render,
  type SectionCache,
} from "./contract";
import { EQUAL_OPPORTUNITY_TEXT, SECTION_HEADINGS } from "./copy";
import { checkSection, type WrittenBlock } from "./guard";
import { SECTION_SPECS, planSection, sectionHeading, type ProseSection } from "./sections";
import { buildSheet } from "./sheet";
import { buildSummary, postingTitle } from "./summary";

/** First attempt plus one regeneration; then the section falls back to a placeholder. */
const MAX_ATTEMPTS = 2;

type CacheEntry = NonNullable<SectionCache[ProseSection]>;
type ProseResult = { section: PostingSection | null; cacheEntry: CacheEntry | null; usage: Usage[] };

type SectionContext = {
  draft: Draft;
  diagnosis: Diagnosis | null;
  forcedWording: string | null;
  cached: CacheEntry | undefined;
  write: WriteSection;
};

/** The last forced wording for a section wins. */
function forcedBySection(forcedWordings: ForcedWording[]): Map<ProseSection, string> {
  return new Map(forcedWordings.map((forced) => [forced.section, forced.text]));
}

async function writeGuarded(write: WriteSection, request: HashInput): Promise<{ blocks: WrittenBlock[] | null; usage: Usage[] }> {
  const usage: Usage[] = [];
  let retryReason: string | null = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const result = await write({ ...request, retryReason });
    usage.push(...result.usage);
    const failure = checkSection(result.output, request.bounds, request.forcedWording);
    if (!failure) return { blocks: result.output, usage };
    retryReason = `${failure.code}: ${failure.detail}`;
  }
  return { blocks: null, usage };
}

async function renderProse(id: ProseSection, context: SectionContext): Promise<ProseResult> {
  const { draft, diagnosis, forcedWording, cached, write } = context;
  const heading = sectionHeading(id, draft);
  // Without a model call: the user's own text when there is one, else the placeholder.
  const fallback: PostingBlock[] = forcedWording ? [{ kind: "paragraph", text: forcedWording }] : [{ kind: "placeholder" }];
  const fixed = (blocks: PostingBlock[]): ProseResult => ({ section: { id, heading, blocks }, cacheEntry: null, usage: [] });

  const plan = planSection(id, draft, diagnosis);
  if (plan.kind === "placeholder") return fixed(fallback);
  if (plan.kind === "omit") return forcedWording ? fixed(fallback) : { section: null, cacheEntry: null, usage: [] };

  const request: HashInput = { section: id, heading, data: plan.data, forcedWording, bounds: SECTION_SPECS[id].bounds };
  const hash = sectionHash(request);
  if (cached?.hash === hash) return { section: cached.section, cacheEntry: cached, usage: [] };

  const { blocks, usage } = await writeGuarded(write, request);
  // A fallback is not cached, so the next turn tries again.
  if (!blocks) return { ...fixed(fallback), usage };
  const section: PostingSection = { id, heading, blocks };
  return { section, cacheEntry: { hash, section }, usage };
}

const equalOpportunity: PostingSection = {
  id: "equalOpportunity",
  heading: SECTION_HEADINGS.equalOpportunity,
  blocks: [{ kind: "paragraph", text: EQUAL_OPPORTUNITY_TEXT }],
};

/**
 * Builds the posting and the internal sheet. Only prose sections call the model, one call each, in parallel;
 * summary, placeholders, equal opportunity text and internal sheet are plain code.
 */
export function createRender(write: WriteSection): Render {
  return async (raw, cache) => {
    const { draft, diagnosis, forcedWordings } = RenderInput.parse(raw);
    const forced = forcedBySection(forcedWordings);
    const results = await Promise.all(
      PROSE_SECTION_IDS.map((id) =>
        renderProse(id, { draft, diagnosis, forcedWording: forced.get(id) ?? null, cached: cache[id], write }),
      ),
    );
    const nextCache: SectionCache = {};
    for (const { cacheEntry } of results) if (cacheEntry) nextCache[cacheEntry.section.id] = cacheEntry;
    const sections = results.flatMap(({ section }) => (section ? [section] : []));
    return {
      output: {
        posting: { title: postingTitle(draft, diagnosis), summary: buildSummary(draft), sections: [...sections, equalOpportunity] },
        sheet: buildSheet(draft, diagnosis),
        cache: nextCache,
      },
      usage: results.flatMap(({ usage }) => usage),
    };
  };
}
