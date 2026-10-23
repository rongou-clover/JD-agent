import type { Page, Request, Route } from "@playwright/test";
import { SessionView, type ApiError, type ChatRequest } from "@/api/contract";
import { SESSION_FIXTURES } from "../fixtures";

/** A fixture parsed through the contract, so specs get the real SessionView type. */
export const fixture = (name: keyof typeof SESSION_FIXTURES): SessionView => SessionView.parse(SESSION_FIXTURES[name]);

type Reply = { status: number; body: SessionView | ApiError };

export const ok = (body: SessionView): Reply => ({ status: 200, body });
export const fail = (status: number, error: ApiError["error"], message: string): Reply => ({
  status,
  body: { error, message },
});

const fulfill = (route: Route, reply: Reply) => route.fulfill({ status: reply.status, json: reply.body });

/** GET /api/sessions/[id] always answers with `reply`. */
export async function mockSession(page: Page, reply: Reply): Promise<void> {
  await page.route("**/api/sessions/*", (route) => fulfill(route, reply));
}

/**
 * POST /api/chat answers with `reply`; every request body is recorded.
 * `gate` delays the answer until it resolves (to observe the pending state).
 */
export async function mockChat(page: Page, reply: Reply, gate?: Promise<void>): Promise<ChatRequest[]> {
  const requests: ChatRequest[] = [];
  await page.route("**/api/chat", async (route) => {
    requests.push(route.request().postDataJSON() as ChatRequest);
    await gate;
    await fulfill(route, reply);
  });
  return requests;
}

/** POST /api/login: 204 for `password`, 401 otherwise. */
export async function mockLogin(page: Page, password: string): Promise<Request[]> {
  const requests: Request[] = [];
  await page.route("**/api/login", async (route) => {
    requests.push(route.request());
    const body = route.request().postDataJSON() as { password: string };
    if (body.password === password) await route.fulfill({ status: 204 });
    else await fulfill(route, fail(401, "unauthorized", "Password non corretta."));
  });
  return requests;
}

/** A promise plus its resolver, to hold a mocked response. */
export function gate(): { promise: Promise<void>; open: () => void } {
  let open = () => {};
  const promise = new Promise<void>((resolve) => {
    open = resolve;
  });
  return { promise, open };
}

/** True when the document does not scroll (design/README.md: one screen, no scrolling). */
export async function fitsViewport(page: Page): Promise<boolean> {
  return page.evaluate(
    () =>
      document.documentElement.scrollHeight <= window.innerHeight &&
      document.documentElement.scrollWidth <= window.innerWidth,
  );
}

/** The inline error (Next also renders an empty role="alert" route announcer). */
export const errorNotice = (page: Page) => page.locator("p[role=alert]");
