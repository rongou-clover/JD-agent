import type { Posting } from "@/render/contract";
import { postingToHtml } from "./html";
import { postingToMarkdown } from "./markdown";
import { fileSlug } from "./posting-text";

export const EXPORT_FORMATS = ["html", "markdown", "pdf"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const EXPORT_LABELS: Record<ExportFormat, string> = { html: "HTML", markdown: "Markdown", pdf: "PDF" };

function downloadText(content: string, fileName: string, mimeType: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: `${mimeType};charset=utf-8` }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** HTML and Markdown are built in the browser; PDF goes through the print dialog (print stylesheet). */
export function exportPosting(posting: Posting, format: ExportFormat): void {
  const name = fileSlug(posting.title);
  switch (format) {
    case "html":
      return downloadText(postingToHtml(posting), `${name}.html`, "text/html");
    case "markdown":
      return downloadText(postingToMarkdown(posting), `${name}.md`, "text/markdown");
    case "pdf":
      return window.print();
  }
}
