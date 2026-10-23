import { expect, test } from "@playwright/test";
import { FIXTURE_SESSION_ID } from "./fixtures";
import { errorNotice, fail, fitsViewport, fixture, gate, mockChat, mockSession, ok } from "./support/mock-api";

const CHAT_URL = `/chat/${FIXTURE_SESSION_ID}`;

test("first turn: role proposal with quick replies", async ({ page }) => {
  await mockSession(page, ok(fixture("diagnosis")));
  await page.goto(CHAT_URL);

  const chat = page.getByRole("region", { name: "Chat" });
  await expect(chat.locator("strong", { hasText: "Content & Social Media Manager" })).toBeVisible();
  await expect(chat.getByRole("button", { name: "È più junior" })).toBeVisible();
  await expect(chat.getByText("Mancano 8 voci obbligatorie")).toBeVisible();
  await expect(page.getByText("Checklist 4 di 12")).toBeVisible();

  const preview = page.getByRole("region", { name: "Anteprima job description" });
  await expect(preview.getByRole("heading", { level: 1 })).toHaveText("Content & Social Media Manager");
  await expect(preview.getByText("[Da definire in chat]").first()).toBeVisible();

  expect(await fitsViewport(page)).toBe(true);
  await expect(page).toHaveScreenshot("chat-diagnosis.png");
});

test("a quick reply sends its id, shows the pending turn, then the next questions", async ({ page }) => {
  await mockSession(page, ok(fixture("diagnosis")));
  const hold = gate();
  const requests = await mockChat(page, ok(fixture("questions")), hold.promise);
  await page.goto(CHAT_URL);

  await page.getByRole("button", { name: "Sì, va bene" }).click();
  await expect(page.getByRole("status", { name: "L'agent sta scrivendo" })).toBeVisible();
  await expect(page.getByRole("button", { name: "È più junior" })).toHaveCount(0);
  await expect(page.getByLabel("Messaggio")).toBeVisible();
  hold.open();

  await expect(page.getByRole("status")).toHaveCount(0);
  expect(requests).toEqual([{ kind: "quickReply", sessionId: FIXTURE_SESSION_ID, replyId: "qr-confirm" }]);
  const questions = page.getByRole("region", { name: "Chat" }).locator("ol").last().getByRole("listitem");
  await expect(questions).toHaveText([
    "Cosa deve aver ottenuto la persona dopo 6 mesi?",
    "Sede e modalità: in ufficio, ibrido o remoto?",
  ]);
  await expect(page.getByText("Checklist 8 di 12")).toBeVisible();
  expect(await fitsViewport(page)).toBe(true);
  await expect(page).toHaveScreenshot("chat-questions.png");
});

test("typing a reply sends a message with Enter", async ({ page }) => {
  await mockSession(page, ok(fixture("questions")));
  const requests = await mockChat(page, ok(fixture("complete")));
  await page.goto(CHAT_URL);

  const input = page.getByLabel("Messaggio");
  await input.fill("Milano, ibrido 3 giorni in ufficio.");
  await input.press("Enter");

  await expect(page.getByText("🎉")).toBeVisible();
  expect(requests).toEqual([
    { kind: "message", sessionId: FIXTURE_SESSION_ID, text: "Milano, ibrido 3 giorni in ufficio." },
  ]);
  await expect(input).toHaveValue("");
});

test("hovering the checklist opens the list of items", async ({ page }) => {
  await mockSession(page, ok(fixture("questions")));
  await page.goto(CHAT_URL);

  await page.getByText("Checklist 8 di 12").hover();
  const dialog = page.getByRole("dialog", { name: "Checklist della JD" });
  await expect(dialog.getByRole("checkbox")).toHaveCount(12);
  await expect(dialog.getByRole("checkbox", { name: "Team e riporto" })).toBeChecked();
  await expect(dialog.getByRole("checkbox", { name: "Contratto" })).not.toBeChecked();
  await expect(page).toHaveScreenshot("chat-checklist.png");
});

test("complete checklist shows JD pronta and no missing chip", async ({ page }) => {
  await mockSession(page, ok(fixture("complete")));
  await page.goto(CHAT_URL);

  await expect(page.getByRole("button", { name: /JD pronta/ })).toBeVisible();
  await expect(page.getByText(/Mancano \d+ voci/)).toHaveCount(0);
  await expect(page.getByText("[Da definire in chat]")).toHaveCount(0);
  expect(await fitsViewport(page)).toBe(true);
  await expect(page).toHaveScreenshot("chat-complete.png");
});

test("a long posting scrolls inside the preview only, never the page", async ({ page }) => {
  await mockSession(page, ok(fixture("complete")));
  await page.goto(CHAT_URL);

  const preview = page.getByRole("region", { name: "Anteprima job description" });
  await expect(preview.getByRole("heading", { name: "Pari opportunità" })).toBeAttached();
  expect(await preview.evaluate((pane) => pane.scrollHeight > pane.clientHeight)).toBe(true);
  expect(await fitsViewport(page)).toBe(true);

  await preview.evaluate((pane) => pane.scrollTo({ top: pane.scrollHeight }));
  await expect(preview.getByRole("heading", { name: "Pari opportunità" })).toBeInViewport();
  expect(await fitsViewport(page)).toBe(true);
  await expect(page).toHaveScreenshot("chat-complete-preview-bottom.png");
});

test("a failed turn shows the API message and gives the text back", async ({ page }) => {
  const message = "L'agent sta ancora rispondendo al messaggio precedente.";
  await mockSession(page, ok(fixture("questions")));
  await mockChat(page, fail(409, "sessionBusy", message));
  await page.goto(CHAT_URL);

  await page.getByLabel("Messaggio").fill("Contratto a tempo indeterminato.");
  await page.getByRole("button", { name: "Invia" }).click();

  await expect(errorNotice(page)).toHaveText(message);
  await expect(page.getByLabel("Messaggio")).toHaveValue("Contratto a tempo indeterminato.");
  expect(await fitsViewport(page)).toBe(true);
});

test("an unknown session shows the error with a way back", async ({ page }) => {
  await mockSession(page, fail(404, "sessionNotFound", "Questa conversazione non esiste più."));
  await page.goto(CHAT_URL);
  await expect(errorNotice(page)).toContainText("Questa conversazione non esiste più.");
  await expect(page.getByRole("link", { name: "Torna alla home" }).last()).toBeVisible();
});

test("unauthorized on load sends the user to the login page", async ({ page }) => {
  await mockSession(page, fail(401, "unauthorized", "Accedi per continuare."));
  await page.goto(CHAT_URL);
  await expect(page).toHaveURL(`/accesso?next=${encodeURIComponent(CHAT_URL)}`);
});
