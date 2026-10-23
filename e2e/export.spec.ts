import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { FIXTURE_SESSION_ID } from "./fixtures";
import { fixture, mockSession, ok } from "./support/mock-api";

test.beforeEach(async ({ page }) => {
  await mockSession(page, ok(fixture("complete")));
  await page.goto(`/chat/${FIXTURE_SESSION_ID}`);
  await expect(page.getByRole("button", { name: /JD pronta/ })).toBeVisible();
});

test("the export menu lists HTML, Markdown and PDF", async ({ page }) => {
  await page.getByRole("button", { name: "Esporta" }).click();
  await expect(page.getByRole("menuitem")).toHaveText(["HTML", "Markdown", "PDF"]);
  await expect(page).toHaveScreenshot("export-menu.png");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
});

test("Markdown is downloaded from the posting", async ({ page }) => {
  await page.getByRole("button", { name: "Esporta" }).click();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("menuitem", { name: "Markdown" }).click()]);
  expect(download.suggestedFilename()).toBe("content-social-media-manager.md");
  const text = await readFile(await download.path(), "utf8");
  expect(text.startsWith("# Content & Social Media Manager\n")).toBe(true);
  expect(text).toContain("## Pari opportunità");
});

test("HTML is downloaded as a standalone page", async ({ page }) => {
  await page.getByRole("button", { name: "Esporta" }).click();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("menuitem", { name: "HTML" }).click()]);
  expect(download.suggestedFilename()).toBe("content-social-media-manager.html");
  const html = await readFile(await download.path(), "utf8");
  expect(html).toContain("<h1>Content &amp; Social Media Manager</h1>");
});

test("PDF opens the print dialog, which prints only the posting", async ({ page }) => {
  await page.evaluate(() => {
    window.print = () => document.body.setAttribute("data-printed", "true");
  });
  await page.getByRole("button", { name: "Esporta" }).click();
  await page.getByRole("menuitem", { name: "PDF" }).click();
  await expect(page.locator("body")).toHaveAttribute("data-printed", "true");

  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("region", { name: "Chat" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Esporta" })).toBeHidden();
  await expect(page.getByRole("heading", { level: 1, name: "Content & Social Media Manager" })).toBeVisible();
  await expect(page).toHaveScreenshot("export-print.png", { fullPage: true });
});
