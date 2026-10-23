import { expect, test, type Page } from "@playwright/test";
import { SessionList } from "@/api/contract";

const SESSIONS = SessionList.parse({
  sessions: [
    {
      sessionId: "3f6c1d2e-8a4b-4c5d-9e7f-0a1b2c3d4e5f",
      title: "Content & Social Media Manager",
      companyName: "Human Maple",
      updatedAt: "2026-10-23T09:30:00.000Z",
      doneCount: 12,
      totalCount: 12,
      complete: true,
    },
    {
      sessionId: "8b1e2f3a-4c5d-4e6f-8a7b-9c0d1e2f3a4b",
      title: "SDR",
      companyName: "Verdeluce",
      updatedAt: "2026-10-22T16:05:00.000Z",
      doneCount: 7,
      totalCount: 12,
      complete: false,
    },
    {
      sessionId: "c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f",
      title: null,
      companyName: null,
      updatedAt: "2026-10-22T11:40:00.000Z",
      doneCount: 0,
      totalCount: 12,
      complete: false,
    },
  ],
});

async function mockSessions(page: Page, body: SessionList) {
  await page.route("**/api/sessions", (route) => route.fulfill({ status: 200, json: body }));
}

test("Le tue JD lists this browser's chats and opens one", async ({ page }) => {
  await mockSessions(page, SESSIONS);
  await page.goto("/");
  await page.getByRole("button", { name: "Le tue JD" }).click();

  const widget = page.getByRole("dialog", { name: "Le tue JD" });
  await expect(widget.getByRole("link")).toHaveCount(3);
  await expect(widget.getByText("🎉 JD pronta")).toBeVisible();
  await expect(widget.getByText("Checklist 7 di 12")).toBeVisible();
  await expect(widget.getByText("Ruolo da definire")).toBeVisible();
  await expect(page).toHaveScreenshot("history-widget.png");

  await widget.getByRole("link", { name: /SDR/ }).click();
  await expect(page).toHaveURL(/\/chat\/8b1e2f3a-4c5d-4e6f-8a7b-9c0d1e2f3a4b$/);
});

test("Le tue JD shows an empty state and closes with Escape", async ({ page }) => {
  await mockSessions(page, { sessions: [] });
  await page.goto("/");
  await page.getByRole("button", { name: "Le tue JD" }).click();
  await expect(page.getByText("Non hai ancora iniziato nessuna JD.")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Le tue JD" })).toHaveCount(0);
});
