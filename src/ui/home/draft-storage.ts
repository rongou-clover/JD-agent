/**
 * The Home text and picked job title kept across the login redirect (docs/decisioni.md). Storage may be
 * unavailable (private mode, blocked site data): every access is best effort.
 */
const KEY = "jd-agent:home-draft";
const ROLE_KEY = "jd-agent:home-role";

export function saveDraft(text: string, jobTitleId: string): void {
  try {
    sessionStorage.setItem(KEY, text);
    sessionStorage.setItem(ROLE_KEY, jobTitleId);
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

export function loadRole(): string | null {
  try {
    return sessionStorage.getItem(ROLE_KEY);
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  try {
    sessionStorage.removeItem(KEY);
    sessionStorage.removeItem(ROLE_KEY);
  } catch {
    return;
  }
}
