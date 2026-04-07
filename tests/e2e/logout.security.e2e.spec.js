import { test, expect } from "@playwright/test";

async function seedAuthSession(page, userId = "7") {
    await page.goto("/");
    await page.evaluate((session) => {
        window.localStorage.setItem("auth_session", JSON.stringify(session));
        window.localStorage.setItem("token", session.token);
    }, {
        userId: String(userId),
        token: "test-token",
        roles: ["Usuarios"],
        createdAt: Date.now(),
    });
}

async function setupMockApi(page) {
    await page.route("**/*", async (route) => {
        const request = route.request();
        const resourceType = request.resourceType();

        if (resourceType !== "fetch" && resourceType !== "xhr") {
            await route.continue();
            return;
        }

        const url = request.url();

        if (url.includes("/api/get-user/") || url.includes("/api/get-user-data/")) {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    success: true,
                    data: {
                        idUsuario: 7,
                        nombre: "Usuario Logout",
                        semestreActual: "8",
                        programa: "Ingenieria",
                    },
                }),
            });
            return;
        }

        if (url.includes("/api/categories") || url.includes("/api/course-types/")) {
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
}

test.describe("Security - cierre de sesion", () => {
    test("logout invalida sesion y bloquea rutas protegidas", async ({ page }) => {
        await seedAuthSession(page, "7");
        await setupMockApi(page);

        await page.goto("/App/7");
        await expect(page.getByRole("heading", { name: "UPB Planner" })).toBeVisible();

        await page.locator(".dropdown-image-button").click();
        await page.getByRole("button", { name: "Cerrar Sesión" }).click();
        await page.getByRole("button", { name: "Sí, cerrar sesión" }).click();

        await expect(page.getByRole("heading", { name: "Iniciar Sesión", exact: true })).toBeVisible();

        const storageState = await page.evaluate(() => ({
            authSession: window.localStorage.getItem("auth_session"),
            token: window.localStorage.getItem("token"),
        }));

        expect(storageState.authSession).toBeNull();
        expect(storageState.token).toBeNull();

        await page.goto("/App/7");
        await expect(page.getByRole("heading", { name: "Iniciar Sesión", exact: true })).toBeVisible();
    });

    test("token suelto sin auth_session no habilita acceso", async ({ page }) => {
        await page.goto("/");
        await page.evaluate(() => {
            window.localStorage.removeItem("auth_session");
            window.localStorage.setItem("token", "orphan-token");
        });
        await setupMockApi(page);

        await page.goto("/App/7");
        await expect(page.getByRole("heading", { name: "Iniciar Sesión", exact: true })).toBeVisible();
    });
});