import { test, expect } from "@playwright/test";

test.describe("E2E Mi perfil - cambio de contrasena", () => {
    test("usuario cambia contrasena correctamente desde Mi Perfil", async ({ page }) => {
        await page.route("**/*", async (route) => {
            const request = route.request();
            const resourceType = request.resourceType();

            if (resourceType !== "fetch" && resourceType !== "xhr") {
                await route.continue();
                return;
            }

            const url = request.url();

            if (url.includes("/api/get-user/")) {
                await route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({
                        success: true,
                        data: {
                            idUsuario: 123,
                            nombre: "Usuario E2E",
                            semestreActual: "8",
                            programa: "Ingenieria",
                        },
                    }),
                });
                return;
            }

            if (url.includes("/api/change-password")) {
                await route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({ success: true }),
                });
                return;
            }

            if (
                url.includes("/api/oficial/") ||
                url.includes("/api/personal/") ||
                url.includes("/api/reminders") ||
                url.includes("/api/notifications/")
            ) {
                await route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify([]),
                });
                return;
            }

            if (url.includes("/api/categories")) {
                await route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify(["Teoria", "Laboratorio", "Personal"]),
                });
                return;
            }

            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify([]),
            });
        });

        await page.goto("/App/123");

        await expect(page.getByRole("heading", { name: "UPB Planner" })).toBeVisible();

        await page.locator(".dropdown-image-button").click();
        await page.getByRole("button", { name: "Mi Perfil" }).click();

        await expect(page.getByRole("heading", { name: "Mi Perfil" })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Cambiar Contrase\u00f1a" })).toBeVisible();

        const changePasswordRequestPromise = page.waitForRequest(
            (request) =>
                request.url().includes("/api/change-password") && request.method() === "PUT"
        );

        await page.getByLabel("Contrase\u00f1a Actual").fill("Actual123");
        await page.getByLabel(/^Nueva Contrase\u00f1a$/).fill("Nueva123");
        await page.getByLabel(/^Confirmar Nueva Contrase\u00f1a$/).fill("Nueva123");
        await page.getByRole("button", { name: "Cambiar Contrase\u00f1a" }).click();

        const changePasswordRequest = await changePasswordRequestPromise;
        const payload = JSON.parse(changePasswordRequest.postData() || "{}");

        expect(payload).toEqual({
            userId: "123",
            currentPassword: "Actual123",
            newPassword: "Nueva123",
        });

        await expect(page.getByText("Contrase\u00f1a cambiada exitosamente")).toBeVisible();
        await expect(page.getByLabel("Contrase\u00f1a Actual")).toHaveValue("");
        await expect(page.getByLabel(/^Nueva Contrase\u00f1a$/)).toHaveValue("");
        await expect(page.getByLabel(/^Confirmar Nueva Contrase\u00f1a$/)).toHaveValue("");
    });
});
