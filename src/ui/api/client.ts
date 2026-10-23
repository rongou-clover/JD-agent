import type { z } from "zod";
import { ApiError, ChatRequest, LoginRequest, SessionList, SessionView } from "@/api/contract";

/** Shown when the server answers with something that is not an ApiError (network down, proxy page...). */
const FALLBACK_MESSAGE = "Qualcosa è andato storto. Riprova tra poco.";

export type ApiErrorCode = ApiError["error"];

/** Thrown by every client call on a non-2xx response; `message` is Italian copy to show as is. */
export class ApiClientError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function toApiError(response: Response): Promise<ApiClientError> {
  const body: unknown = await response.json().catch(() => null);
  const parsed = ApiError.safeParse(body);
  return parsed.success
    ? new ApiClientError(parsed.data.error, parsed.data.message)
    : new ApiClientError("internal", FALLBACK_MESSAGE);
}

async function request(url: string, init?: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, headers: { "content-type": "application/json" }, cache: "no-store" });
  } catch {
    throw new ApiClientError("internal", FALLBACK_MESSAGE);
  }
  if (!response.ok) throw await toApiError(response);
  return response;
}

async function parseJson<T extends z.ZodType>(response: Response, schema: T): Promise<z.infer<T>> {
  const parsed = schema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) throw new ApiClientError("internal", FALLBACK_MESSAGE);
  return parsed.data;
}

/** POST /api/chat: a new message (null sessionId starts a session) or a quick reply. */
export async function sendChat(input: ChatRequest): Promise<SessionView> {
  const body = ChatRequest.parse(input);
  const response = await request("/api/chat", { method: "POST", body: JSON.stringify(body) });
  return parseJson(response, SessionView);
}

/** GET /api/sessions/[id]. */
export async function getSession(sessionId: string): Promise<SessionView> {
  const response = await request(`/api/sessions/${encodeURIComponent(sessionId)}`);
  return parseJson(response, SessionView);
}

/** GET /api/sessions: the chats started from this browser, newest first. */
export async function listSessions(): Promise<SessionList> {
  return parseJson(await request("/api/sessions"), SessionList);
}

/** POST /api/login: the server sets the session cookie. */
export async function login(password: string): Promise<void> {
  const body = LoginRequest.parse({ password });
  await request("/api/login", { method: "POST", body: JSON.stringify(body) });
}

/** Where to send the user when the server says they are not logged in. */
export function loginUrl(nextPath: string): string {
  return `/accesso?next=${encodeURIComponent(nextPath)}`;
}

/** Only same-origin paths are accepted as `?next=`, to avoid open redirects. */
export function safeNextPath(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}
