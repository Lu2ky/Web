import { test, expect } from "@playwright/test";
import axe from "axe-core";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function runAxe(page) {
  await page.addScriptTag({ content: axe.source });
  const results = await page.evaluate(async (tags) => {
    return await window.axe.run(document, { runOnly: { type: "tag", values: tags } });
  }, AXE_TAGS);

  return results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    targets: violation.nodes.map((node) => node.target.join(" ")),
  }));
}

async function expectNoBlockingViolations(page, label) {
  const violations = await runAxe(page);
  expect(violations, `${label}: ${JSON.stringify(violations, null, 2)}`).toEqual([]);
}

async function openLogin(page) {
  await page.goto("/#/", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Iniciar Sesión", exact: true })).toBeVisible();
}

test.describe("Accesibilidad y apariencia", () => {
  test("el login no tiene violaciones axe en tema claro", async ({ page }) => {
    await openLogin(page);
    await expectNoBlockingViolations(page, "login claro");
  });

  test("el login no tiene violaciones axe en tema oscuro", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("upb:appearance", JSON.stringify({ theme: "dark", fontSize: "md" }));
    });
    await openLogin(page);

    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expectNoBlockingViolations(page, "login oscuro");
  });

  test("el tema y el tamaño de letra se aplican antes del primer render", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("upb:appearance", JSON.stringify({ theme: "dark", fontSize: "lg" }));
    });

    await page.goto("/#/", { waitUntil: "domcontentloaded" });

    const root = page.locator("html");
    await expect(root).toHaveAttribute("data-theme", "dark");
    await expect(root).toHaveAttribute("data-font-size", "lg");
    await expect
      .poll(async () => page.evaluate(() => getComputedStyle(document.documentElement).fontSize))
      .toBe("18px");
  });

  test("las preferencias de apariencia sobreviven a una recarga", async ({ page }) => {
    await openLogin(page);

    await page.evaluate(() => {
      localStorage.setItem("upb:appearance", JSON.stringify({ theme: "dark", fontSize: "sm" }));
    });
    await page.reload({ waitUntil: "networkidle" });

    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("html")).toHaveAttribute("data-font-size", "sm");
  });

  test("la página de login declara idioma y metadatos de tema", async ({ page }) => {
    await openLogin(page);

    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.locator('meta[name="theme-color"]')).toHaveCount(2);
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
      "content",
      /width=device-width/,
    );
  });
});
