import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

function parseDotEnv(fileContent) {
    const result = {};
    const lines = fileContent.split(/\r?\n/);

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex === -1) continue;
        const key = trimmed.slice(0, eqIndex).trim();
        const value = trimmed.slice(eqIndex + 1).trim();
        result[key] = value;
    }

    return result;
}

function readRealEndpoints() {
    const envPath = path.resolve(process.cwd(), ".env");
    const envFile = fs.readFileSync(envPath, "utf8");
    const envMap = parseDotEnv(envFile);

    return {
        changePassword: envMap.VITE_API_CHANGE_PASSWORD,
        ldapValidate: envMap.VITE_API_URL_LDPA,
        createUser: envMap.VITE_API_CREATE_USER,
    };
}

test.describe("E2E real - persistencia cambio de contrasena", () => {
    test("cambia contrasena y valida persistencia real en backend", async ({ page, request }) => {
        const endpoints = readRealEndpoints();

        if (!endpoints.changePassword) {
            throw new Error("Faltan endpoints en .env para ejecutar persistencia real");
        }

        const userId = process.env.E2E_REAL_USER_ID;
        const originalPassword = process.env.E2E_REAL_CURRENT_PASSWORD;
        const newPassword = process.env.E2E_REAL_NEW_PASSWORD;

        if (!userId || !originalPassword || !newPassword) {
            throw new Error(
                "Define E2E_REAL_USER_ID, E2E_REAL_CURRENT_PASSWORD y E2E_REAL_NEW_PASSWORD para validar persistencia real"
            );
        }

        await page.goto(`/App/${userId}`);

        await expect(page.getByRole("heading", { name: "UPB Planner" })).toBeVisible();
        await page.locator(".dropdown-image-button").click();
        await page.getByRole("button", { name: "Mi Perfil" }).click();

        await expect(page.getByRole("heading", { name: "Mi Perfil" })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Cambiar Contraseña" })).toBeVisible();

        const responsePromise = page.waitForResponse(
            (response) =>
                response.url().includes("/change-password") && response.request().method() === "PUT"
        );

        await page.getByLabel("Contraseña Actual").fill(originalPassword);
        await page.getByLabel(/^Nueva Contraseña$/).fill(newPassword);
        await page.getByLabel(/^Confirmar Nueva Contraseña$/).fill(newPassword);
        await page.getByRole("button", { name: "Cambiar Contraseña" }).click();

        const changePasswordResponse = await responsePromise;
        const changePasswordBody = await changePasswordResponse.text();
        expect(
            changePasswordResponse.ok(),
            `Cambio inicial falló: HTTP ${changePasswordResponse.status()} ${changePasswordBody}`
        ).toBeTruthy();

        await expect(page.getByText("Contraseña cambiada exitosamente")).toBeVisible();

        const revertResponse = await request.put(endpoints.changePassword, {
            data: {
                userId,
                currentPassword: newPassword,
                newPassword: originalPassword,
            },
            timeout: 20000,
        });

        const revertBody = await revertResponse.text();
        expect(
            revertResponse.ok(),
            `Reversión falló: HTTP ${revertResponse.status()} ${revertBody}`
        ).toBeTruthy();
    });
});
