import type { Posting, PostingBlock } from "@/render/contract";
import { PLACEHOLDER_TEXT } from "@/ui/export/posting-text";

function Placeholder() {
  return <span className="text-muted-foreground">{PLACEHOLDER_TEXT}</span>;
}

function Block({ block }: { block: PostingBlock }) {
  switch (block.kind) {
    case "paragraph":
      return <p className="m-0 mb-3.5">{block.text}</p>;
    case "bullets":
      return (
        <ul className="m-0 mb-3.5 list-disc pl-5">
          {block.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );
    case "placeholder":
      return (
        <p className="m-0 mb-3.5">
          <Placeholder />
        </p>
      );
  }
}

/** The posting as a plain document page: title, summary box, sections. */
export function PostingView({ posting }: { posting: Posting }) {
  return (
    <>
      <h1 className="m-0 mb-1 text-[22px] font-bold text-foreground">{posting.title}</h1>
      {posting.summary.length > 0 && (
        <ul className="m-0 mb-4 list-none p-0 text-body-soft">
          {posting.summary.map((row) => (
            <li key={row.label}>
              <span className="font-bold">{row.label}:</span> {row.value ?? <Placeholder />}
            </li>
          ))}
        </ul>
      )}
      {posting.sections.map((section) => (
        <section key={section.id} aria-label={section.heading}>
          <h2 className="m-0 mb-1 text-[15px] font-bold text-foreground">{section.heading}</h2>
          {section.blocks.map((block, index) => (
            <Block key={index} block={block} />
          ))}
        </section>
      ))}
    </>
  );
}
