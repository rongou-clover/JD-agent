import type { Posting, PostingBlock } from "@/render/contract";
import { PLACEHOLDER_TEXT } from "./posting-text";

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);
}

const STYLE = [
  "body{margin:0;padding:40px 16px;background:#ffffff;color:#1f2937;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55}",
  "main{max-width:720px;margin:0 auto}",
  "h1{margin:0 0 12px;font-size:22px;color:#111827}",
  "h2{margin:20px 0 4px;font-size:15px;color:#111827}",
  "p,ul{margin:0 0 10px}",
  "ul{padding-left:20px}",
  ".summary{list-style:none;padding:0;color:#4b5563}",
  ".placeholder{color:#6b7280}",
].join("");

const placeholder = `<span class="placeholder">${escapeHtml(PLACEHOLDER_TEXT)}</span>`;

function blockToHtml(block: PostingBlock): string {
  switch (block.kind) {
    case "paragraph":
      return `<p>${escapeHtml(block.text)}</p>`;
    case "bullets":
      return `<ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
    case "placeholder":
      return `<p>${placeholder}</p>`;
  }
}

/** A standalone HTML page with the posting, styled like the preview. */
export function postingToHtml(posting: Posting): string {
  const summary = posting.summary.length
    ? `<ul class="summary">${posting.summary
        .map((row) => `<li><strong>${escapeHtml(row.label)}:</strong> ${row.value === null ? placeholder : escapeHtml(row.value)}</li>`)
        .join("")}</ul>`
    : "";
  const sections = posting.sections
    .map((section) => `<section><h2>${escapeHtml(section.heading)}</h2>${section.blocks.map(blockToHtml).join("")}</section>`)
    .join("");
  const title = escapeHtml(posting.title);
  return [
    "<!doctype html>",
    '<html lang="it">',
    `<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>${STYLE}</style></head>`,
    `<body><main><h1>${title}</h1>${summary}${sections}</main></body>`,
    "</html>",
    "",
  ].join("\n");
}
