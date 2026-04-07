import { test, expect } from "@playwright/test";

async function setupMockApi(page) {
  await page.route("**/*", async (route) => {
    const request = route.request();
    const isApiCall = ["fetch", "xhr"].includes(request.resourceType())
      && request.url().includes("/LDAPservice");

    if (!isApiCall) {
      await route.continue();
      return;
    }

    const body = request.postDataJSON?.() || {};
    const user = String(body.user || "");
    const pass = String(body.pass || "");

    if (user === "user" && pass === "userpass") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          token: "user-token-abc456",
          roles: ["Usuarios"],
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        message: "Usuario o contraseña incorrectos",
      }),
    });
  });
}

async function openLogin(page) {
  await page.goto("/#/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Iniciar Sesión", exact: true })).toBeVisible();
}

async function submitLogin(page, user, pass, acceptTerms = true) {
  await page.getByPlaceholder("Id Usuario").fill(user);
  await page.getByPlaceholder("Contraseña").fill(pass);
  if (acceptTerms) {
    await page.getByRole("checkbox").check();
  }
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();
}

test.describe("LogIn Security Tests", () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApi(page);
    await openLogin(page);
  });

  test("permite iniciar sesión con credenciales válidas", async ({ page }) => {
    await submitLogin(page, "user", "userpass", true);
    await page.waitForURL(/#\/app\/user$/i, { timeout: 10000 });
    await expect(page).toHaveURL(/#\/app\/user$/i);
  });

  test("valida credenciales con el endpoint LDAP", async ({ page }) => {
    let ldapCalls = 0;
    page.on("request", (request) => {
      if (request.url().includes("/LDAPservice") && request.method() === "POST") {
        ldapCalls += 1;
      }
    });

    await submitLogin(page, "wronguser", "wrongpass", true);
    await expect(page.getByText("Usuario o contraseña incorrectos")).toBeVisible();
    expect(ldapCalls).toBeGreaterThan(0);
  });

  test("redirige al panel principal cuando autenticación es correcta", async ({ page }) => {
    await submitLogin(page, "user", "userpass", true);
    await expect(page).toHaveURL(/#\/app\/user$/i);
  });

  test("muestra mensaje informativo cuando falla autenticación", async ({ page }) => {
    await submitLogin(page, "attacker", "badpass", true);
    await expect(page.getByText("Usuario o contraseña incorrectos")).toBeVisible();
  });

  test("mantiene contraseña enmascarada y no la expone en HTML", async ({ page }) => {
    const passwordInput = page.getByPlaceholder("Contraseña");
    await expect(passwordInput).toHaveAttribute("type", "password");

    const password = "MySecurePassword123";
    await passwordInput.fill(password);

    const visibleText = await page.textContent("body");
    expect(visibleText || "").not.toContain(password);
  });
});
