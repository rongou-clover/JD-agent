import { expect, test, type Page } from "@playwright/test";
import { errorNotice, fail, fitsViewport, fixture, mockChat, mockLogin, mockSession, ok } from "./support/mock-api";

const BRIEF = fixture("diagnosis").transcript[0];
const BRIEF_TEXT = BRIEF?.role === "user" ? BRIEF.text : "";
const TEXTAREA = "Descrivi l'azienda e la persona che cerchi";

async function pickRole(page: Page, name = "Content / Social Media Manager") {
  await page.getByRole("button", { name: "Ruolo" }).click();
  await page.getByRole("option", { name }).click();
}

test("the role picker lists the catalog by job family and fits one screen", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Ruolo" }).click();
  await expect(page.getByRole("option")).toHaveCount(15);
  expect(await fitsViewport(page)).toBe(true);
  await expect(page).toHaveScreenshot("home-role-picker.png");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);
});

test("home matches the wireframe and fits one screen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Chi stai cercando?");
  await expect(page.getByText("Scegli prima il ruolo")).toBeVisible();
  await expect(page.getByText("Allega un documento")).toHaveCount(0);
  expect(await fitsViewport(page)).toBe(true);
  await expect(page).toHaveScreenshot("home.png");
});

test("the hint explains what the agent needs", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Cosa ti serve per iniziare?" }).click();
  await expect(page.getByText("Il resto te lo chiedo io.")).toBeVisible();
  expect(await fitsViewport(page)).toBe(true);
});

test("Inizia opens the chat at once, then the session it starts", async ({ page }) => {
  const view = fixture("diagnosis");
  let release = () => {};
  const requests = await mockChat(page, ok(view), new Promise<void>((resolve) => (release = resolve)));
  await mockSession(page, ok(view));
  await page.goto("/");

  await page.getByLabel(TEXTAREA).fill(BRIEF_TEXT);
  await expect(page.getByText("Scegli prima il ruolo")).toBeVisible();
  await expect(page.getByRole("button", { name: "Inizia", exact: true })).toBeDisabled();
  await pickRole(page);
  await expect(page.getByRole("button", { name: "Ruolo" })).toContainText("Content / Social Media Manager");
  await page.getByRole("button", { name: "Inizia", exact: true }).click();

  await expect(page).toHaveURL("/chat/nuova");
  await expect(page.getByRole("region", { name: "Chat" }).getByText(BRIEF_TEXT)).toBeVisible();
  await expect(page.getByRole("status", { name: "L'agent sta scrivendo" })).toBeVisible();
  release();
  await expect(page).toHaveURL(`/chat/${view.sessionId}`);
  expect(requests).toEqual([{ kind: "start", jobTitleId: "content-social-media-manager", text: BRIEF_TEXT }]);
  await expect(page.getByRole("button", { name: "Sì, va bene" })).toBeVisible();
});

test("an API error is shown in the chat, and Home keeps the text", async ({ page }) => {
  const message = "Per oggi l'agent ha esaurito il budget: riprova domani.";
  await mockChat(page, fail(429, "budgetExhausted", message));
  await page.goto("/");
  await pickRole(page);
  await page.getByLabel(TEXTAREA).fill(BRIEF_TEXT);
  await page.getByRole("button", { name: "Inizia", exact: true }).click();

  await expect(errorNotice(page)).toContainText(message);
  await expect(page).toHaveURL("/chat/nuova");
  expect(await fitsViewport(page)).toBe(true);
  await expect(page).toHaveScreenshot("chat-start-error.png");

  await page.getByRole("link", { name: "Torna alla home" }).last().click();
  await expect(page).toHaveURL("/");
  await expect(page.getByLabel(TEXTAREA)).toHaveValue(BRIEF_TEXT);
});

test("unauthorized sends the user to the login page", async ({ page }) => {
  await mockChat(page, fail(401, "unauthorized", "Accedi per continuare."));
  await page.goto("/");
  await pickRole(page);
  await page.getByLabel(TEXTAREA).fill(BRIEF_TEXT);
  await page.getByRole("button", { name: "Inizia", exact: true }).click();
  await expect(page).toHaveURL("/accesso?next=%2F");
});

test("the typed text and the role survive the login and are cleared once the session starts", async ({ page }) => {
  await mockChat(page, fail(401, "unauthorized", "Accedi per continuare."));
  await mockLogin(page, "trifoglio");
  await page.goto("/");
  await pickRole(page);
  await page.getByLabel(TEXTAREA).fill(BRIEF_TEXT);
  await page.getByRole("button", { name: "Inizia", exact: true }).click();

  await expect(page).toHaveURL("/accesso?next=%2F");
  await page.getByLabel("Password").fill("trifoglio");
  await page.getByRole("button", { name: "Entra" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByLabel(TEXTAREA)).toHaveValue(BRIEF_TEXT);
  await expect(page.getByRole("button", { name: "Ruolo" })).toContainText("Content / Social Media Manager");

  const view = fixture("diagnosis");
  await page.unroute("**/api/chat");
  await mockChat(page, ok(view));
  await mockSession(page, ok(view));
  await page.getByRole("button", { name: "Inizia", exact: true }).click();
  await expect(page).toHaveURL(`/chat/${view.sessionId}`);
  expect(await page.evaluate(() => sessionStorage.length)).toBe(0);
});
