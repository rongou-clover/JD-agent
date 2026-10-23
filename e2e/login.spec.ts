import { expect, test } from "@playwright/test";
import { FIXTURE_SESSION_ID } from "./fixtures";
import { errorNotice, fitsViewport, fixture, mockLogin, mockSession, ok } from "./support/mock-api";

const NEXT = `/chat/${FIXTURE_SESSION_ID}`;

test("login page fits one screen", async ({ page }) => {
  await page.goto(`/accesso?next=${encodeURIComponent(NEXT)}`);
  await expect(page.getByRole("heading", { name: "Accedi alla demo" })).toBeVisible();
  expect(await fitsViewport(page)).toBe(true);
  await expect(page).toHaveScreenshot("login.png");
});

test("a wrong password shows the API message", async ({ page }) => {
  await mockLogin(page, "trifoglio");
  await page.goto(`/accesso?next=${encodeURIComponent(NEXT)}`);
  await page.getByLabel("Password").fill("sbagliata");
  await page.getByRole("button", { name: "Entra" }).click();
  await expect(errorNotice(page)).toHaveText("Password non corretta.");
  await expect(page).toHaveURL(/\/accesso/);
});

test("the right password goes back to the page the user came from", async ({ page }) => {
  const requests = await mockLogin(page, "trifoglio");
  await mockSession(page, ok(fixture("diagnosis")));
  await page.goto(`/accesso?next=${encodeURIComponent(NEXT)}`);
  await page.getByLabel("Password").fill("trifoglio");
  await page.getByRole("button", { name: "Entra" }).click();
  await expect(page).toHaveURL(NEXT);
  expect(requests[0]?.postDataJSON()).toEqual({ password: "trifoglio" });
});

test("an external next is ignored", async ({ page }) => {
  await mockLogin(page, "trifoglio");
  await page.goto(`/accesso?next=${encodeURIComponent("//example.com")}`);
  await page.getByLabel("Password").fill("trifoglio");
  await page.getByRole("button", { name: "Entra" }).click();
  await expect(page).toHaveURL("/");
});
