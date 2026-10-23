import type { Posting, PostingBlock } from "@/render/contract";
import { PLACEHOLDER_TEXT } from "./posting-text";

function blockToMarkdown(block: PostingBlock): string {
  switch (block.kind) {
    case "paragraph":
      return block.text;
    case "bullets":
      return block.items.map((item) => `- ${item}`).join("\n");
    case "placeholder":
      return PLACEHOLDER_TEXT;
  }
}

/** The posting as a Markdown document: title, summary list, one level-2 heading per section. */
export function postingToMarkdown(posting: Posting): string {
  const parts = [`# ${posting.title}`];
  if (posting.summary.length > 0) {
    parts.push(posting.summary.map((row) => `- **${row.label}:** ${row.value ?? PLACEHOLDER_TEXT}`).join("\n"));
  }
  for (const section of posting.sections) {
    parts.push(`## ${section.heading}`, ...section.blocks.map(blockToMarkdown));
  }
  return `${parts.join("\n\n")}\n`;
}
