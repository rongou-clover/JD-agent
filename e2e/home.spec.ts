import { expect, test } from "@playwright/test";
import { errorNotice, fail, fitsViewport, fixture, mockChat, mockSession, ok } from "./support/mock-api";

const BRIEF = fixture("diagnosis").transcript[0];
const BRIEF_TEXT = BRIEF?.role === "user" ? BRIEF.text : "";

test("home matches the wireframe and fits one screen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Chi stai cercando?");
  await expect(page.getByText("Puoi anche incollare una bozza o un annuncio esistente")).toBeVisible();
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

test("Inizia starts a session and opens the chat", async ({ page }) => {
  const view = fixture("diagnosis");
  const requests = await mockChat(page, ok(view));
  await mockSession(page, ok(view));
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Inizia", exact: true })).toBeDisabled();
  await page.getByLabel("Descrivi il ruolo e la persona che cerchi").fill(BRIEF_TEXT);
  await page.getByRole("button", { name: "Inizia", exact: true }).click();

  await expect(page).toHaveURL(`/chat/${view.sessionId}`);
  expect(requests).toEqual([{ kind: "message", sessionId: null, text: BRIEF_TEXT }]);
  await expect(page.getByRole("button", { name: "Sì, va bene" })).toBeVisible();
});

test("an API error is shown inline", async ({ page }) => {
  const message = "Per oggi l'agent ha esaurito il budget: riprova domani.";
  await mockChat(page, fail(429, "budgetExhausted", message));
  await page.goto("/");
  await page.getByLabel("Descrivi il ruolo e la persona che cerchi").fill(BRIEF_TEXT);
  await page.getByRole("button", { name: "Inizia", exact: true }).click();

  await expect(errorNotice(page)).toHaveText(message);
  await expect(page).toHaveURL("/");
  expect(await fitsViewport(page)).toBe(true);
  await expect(page).toHaveScreenshot("home-error.png");
});

test("unauthorized sends the user to the login page", async ({ page }) => {
  await mockChat(page, fail(401, "unauthorized", "Accedi per continuare."));
  await page.goto("/");
  await page.getByLabel("Descrivi il ruolo e la persona che cerchi").fill(BRIEF_TEXT);
  await page.getByRole("button", { name: "Inizia", exact: true }).click();
  await expect(page).toHaveURL("/accesso?next=%2F");
});
