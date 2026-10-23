import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { FIXTURE_SESSION_ID } from "./fixtures";
import { fitsViewport, fixture, mockSession, ok } from "./support/mock-api";

const CHAT_URL = `/chat/${FIXTURE_SESSION_ID}`;

async function openComplete(page: Page) {
  await mockSession(page, ok(fixture("complete")));
  await page.goto(CHAT_URL);
  await expect(page.getByRole("button", { name: /JD pronta/ })).toBeVisible();
}

const tab = (page: Page, name: string) => page.getByRole("tab", { name });

test("switching tabs shows the internal sheet and back the posting", async ({ page }) => {
  await openComplete(page);
  await expect(page.getByRole("tablist", { name: "Contenuto dell'anteprima" })).toBeVisible();
  await expect(tab(page, "Annuncio")).toHaveAttribute("aria-selected", "true");

  await tab(page, "Scheda interna").click();
  await expect(tab(page, "Scheda interna")).toHaveAttribute("aria-selected", "true");
  const sheet = page.getByRole("tabpanel", { name: "Scheda interna" });
  await expect(sheet.getByRole("heading", { level: 1 })).toHaveText("Content & Social Media Manager");
  await expect(sheet.getByText("Mid (S2)")).toBeVisible();
  const rows = sheet.getByRole("row");
  await expect(rows.first()).toHaveText(/Skill\s*Tipo\s*Criticità\s*P atteso\s*Obbligatoria\s*Origine/);
  await expect(sheet.getByRole("row", { name: /Grafica per social e report/ })).toContainText("Indicata da te");
  await expect(sheet.getByRole("row", { name: /Leggere i dati di performance/ })).toContainText("Dal catalogo");
  await expect(sheet.getByText("32.000–38.000 € lordi annui, non pubblicata nell'annuncio")).toBeVisible();
  await expect(page.getByRole("tabpanel", { name: "Annuncio" })).toBeHidden();
  expect(await fitsViewport(page)).toBe(true);
  await expect(page).toHaveScreenshot("sheet-tab.png");

  await tab(page, "Annuncio").click();
  await expect(page.getByRole("tabpanel", { name: "Annuncio" }).getByRole("heading", { name: "Pari opportunità" })).toBeAttached();
  await expect(sheet).toBeHidden();
});

test("arrow keys move between tabs", async ({ page }) => {
  await openComplete(page);
  await tab(page, "Annuncio").focus();
  await page.keyboard.press("ArrowRight");
  await expect(tab(page, "Scheda interna")).toBeFocused();
  await expect(page.getByRole("tabpanel", { name: "Scheda interna" })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(tab(page, "Annuncio")).toBeFocused();
  await expect(page.getByRole("tabpanel", { name: "Annuncio" })).toBeVisible();
});

test("a hybrid profile is flagged and missing values show a dash", async ({ page }) => {
  const view = fixture("diagnosis");
  if (!view.sheet) throw new Error("The diagnosis fixture has a sheet");
  const hybrid = { ...view.sheet, hybridRoles: ["Content / Social Media Manager", "Videomaker", "Graphic Designer"] };
  await mockSession(page, ok({ ...view, sheet: hybrid }));
  await page.goto(CHAT_URL);
  await tab(page, "Scheda interna").click();

  const sheet = page.getByRole("tabpanel", { name: "Scheda interna" });
  await expect(sheet.getByRole("note")).toHaveText(
    "Profilo ibrido: Content / Social Media Manager, Videomaker, Graphic Designer, ricerca potenzialmente lunga.",
  );
  await expect(sheet.getByRole("region", { name: "RAL" })).toContainText("—");
  await expect(sheet.getByRole("region", { name: "Note del responsabile" })).toContainText("—");
  expect(await fitsViewport(page)).toBe(true);
});

test("export and print stay posting-only while the sheet tab is open", async ({ page }) => {
  await openComplete(page);
  await tab(page, "Scheda interna").click();

  await page.getByRole("button", { name: "Esporta" }).click();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("menuitem", { name: "Markdown" }).click()]);
  const text = await readFile(await download.path(), "utf8");
  expect(text).toContain("## Pari opportunità");
  expect(text).not.toContain("Dal catalogo");
  expect(text).not.toContain("Note del responsabile");

  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("tablist")).toBeHidden();
  await expect(page.getByRole("heading", { level: 2, name: "Pari opportunità" })).toBeVisible();
  await expect(page.getByText("Dal catalogo").first()).toBeHidden();
  await expect(page.getByText("Note del responsabile")).toBeHidden();
});
