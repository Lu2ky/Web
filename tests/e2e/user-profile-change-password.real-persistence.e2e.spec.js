import { test, expect } from "@playwright/test";

async function login(page, userId, password, expectSuccess = true) {
    await page.goto("/");
    await page.getByPlaceholder("Id Usuario").fill(userId);
    await page.getByPlaceholder("Contraseña").fill(password);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Iniciar Sesión" }).click();

    const dashboardHeading = page.getByRole("heading", { name: "UPB Planner" });

    if (expectSuccess) {
        await expect(dashboardHeading).toBeVisible({ timeout: 20000 });
        return;
    }

    let loggedIn = true;
    try {
        await expect(dashboardHeading).toBeVisible({ timeout: 8000 });
    } catch {
        loggedIn = false;
    }

    expect(loggedIn, "La contraseña anterior todavía inicia sesión; no hay evidencia de persistencia").toBeFalsy();
    await expect(page.getByRole("heading", { name: "Iniciar Sesión" })).toBeVisible();
}

async function logout(page) {
    await page.locator(".dropdown-image-button").click();
    await page.getByRole("button", { name: "Cerrar Sesión" }).click();
    await page.getByRole("button", { name: "Sí, cerrar sesión" }).click();
    await expect(page.getByRole("heading", { name: "Iniciar Sesión" })).toBeVisible();
}

async function openPasswordModal(page) {
    await page.locator(".dropdown-image-button").click();
    await page.getByRole("button", { name: "Mi Perfil" }).click();
    await expect(page.getByRole("heading", { name: "Mi Perfil" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cambiar Contraseña" })).toBeVisible();
}

async function changePassword(page, currentPassword, newPassword) {
    const responsePromise = page.waitForResponse(
        (response) =>
            response.url().includes("/change-password") && response.request().method() === "PUT"
    );

    await page.getByLabel("Contraseña Actual").fill(currentPassword);
    await page.getByLabel(/^Nueva Contraseña$/).fill(newPassword);
    await page.getByLabel(/^Confirmar Nueva Contraseña$/).fill(newPassword);
    await page.getByRole("button", { name: "Cambiar Contraseña" }).click();

    const response = await responsePromise;
    const body = await response.text();
    expect(response.ok(), `Cambio de contraseña falló: HTTP ${response.status()} ${body}`).toBeTruthy();

    const feedback = page.locator(".alert.alert-success, .alert.alert-error").first();
    await feedback.waitFor({ state: "visible", timeout: 20000 });
    const message = (await feedback.textContent()) || "";
    expect(
        /exitosamente|éxito|correctamente/i.test(message),
        `Cambio no confirmado en UI. Mensaje: ${message}`
    ).toBeTruthy();
}

test("E2E real - persistencia completa de cambio de contrasena con reversión", async ({ page }) => {
    const userId = process.env.E2E_REAL_USER_ID;
    const originalPassword = process.env.E2E_REAL_CURRENT_PASSWORD;
    const temporaryPassword = process.env.E2E_REAL_NEW_PASSWORD;

    if (!userId || !originalPassword || !temporaryPassword) {
        throw new Error(
            "Define E2E_REAL_USER_ID, E2E_REAL_CURRENT_PASSWORD y E2E_REAL_NEW_PASSWORD para validar persistencia real"
        );
    }

    if (originalPassword === temporaryPassword) {
        throw new Error("E2E_REAL_NEW_PASSWORD debe ser diferente a E2E_REAL_CURRENT_PASSWORD");
    }

    let reverted = false;

    try {
        await login(page, userId, originalPassword, true);
        await openPasswordModal(page);
        await changePassword(page, originalPassword, temporaryPassword);

        await logout(page);
        await login(page, userId, originalPassword, false);
        await login(page, userId, temporaryPassword, true);

        await openPasswordModal(page);
        await changePassword(page, temporaryPassword, originalPassword);
        reverted = true;

        await logout(page);
        await login(page, userId, originalPassword, true);
    } finally {
        if (!reverted) {
            await page.goto("/");
        }
    }
});
