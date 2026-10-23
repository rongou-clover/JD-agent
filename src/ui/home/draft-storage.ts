/**
 * The Home text kept across the login redirect and handed to the chat that starts the session (docs/decisioni.md).
 * Storage may be unavailable (private mode, blocked site data): every access is best effort.
 */
const KEY = "jd-agent:home-draft";

export function saveDraft(text: string): void {
  try {
    sessionStorage.setItem(KEY, text);
  } catch {
    return;
  }
}

export function loadDraft(): string {
  try {
    return sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function clearDraft(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    return;
  }
}
