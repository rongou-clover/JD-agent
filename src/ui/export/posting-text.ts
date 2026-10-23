/** Text shown wherever a required field is still missing (preview and exports). */
export const PLACEHOLDER_TEXT = "[Da definire in chat]";

/** A file name from the posting title: "Content & Social Media Manager" → "content-social-media-manager". */
export function fileSlug(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug === "" ? "job-description" : slug;
}
