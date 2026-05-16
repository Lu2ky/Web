import { test, expect } from "@playwright/test";

async function seedAuthSession(page, userId) {
    await page.addInitScript((session) => {
        window.localStorage.setItem("auth_session", JSON.stringify(session));
        window.localStorage.setItem(`onboarding_visited:${session.userId}`, JSON.stringify({
            completed: true,
            version: 1,
            completedAt: Date.now(),
        }));
    }, {
        userId: String(userId),
        token: "test-token",
        roles: ["Usuarios"],
        createdAt: Date.now(),
    });
}

async function setupMockApi(page, options = {}) {
    const silenceRequests = [];
    const activateRequests = [];

    const silenceStatus = options.silenceStatus ?? 200;
    const activateStatus = options.activateStatus ?? 200;

    await page.route("**/*", async (route) => {
        const request = route.request();
        const resourceType = request.resourceType();

        if (resourceType !== "fetch" && resourceType !== "xhr") {
            await route.continue();
            return;
        }

        const url = request.url();

        if (url.includes("/api/stop-all-notifications")) {
            const payload = JSON.parse(request.postData() || "{}");
            silenceRequests.push(payload);
            await route.fulfill({
                status: silenceStatus,
                contentType: "application/json",
                body: silenceStatus >= 400 ? JSON.stringify({ success: false, message: "error" }) : JSON.stringify({ muteUntil: Date.now() + 600000 }),
            });
            return;
        }

        if (url.includes("/api/restore-notifications")) {
            const payload = JSON.parse(request.postData() || "{}");
            activateRequests.push(payload);
            await route.fulfill({
                status: activateStatus,
                contentType: "application/json",
                body: activateStatus >= 400 ? JSON.stringify({ success: false, message: "error" }) : JSON.stringify({ success: true }),
            });
            return;
        }

        if (url.includes("/api/get-user/") || url.includes("/api/get-user-data/")) {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    success: true,
                    data: {
                        idUsuario: 7,
                        nombre: "Usuario Seguridad",
                        semestreActual: "8",
                        programa: "Ingenieria",
                        correo: "test@upb.edu",
                        antelacionNotis: "00:30:00",
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

    return { silenceRequests, activateRequests };
}

async function openPreferences(page, userId) {
    await seedAuthSession(page, userId);
    await page.goto(`/App/${userId}`);
    await expect(page.getByRole("heading", { name: "UPB Planner" })).toBeVisible();

    await page.locator(".dropdown-image-button").click();
    await page.getByRole("button", { name: "Preferencias" }).click();
    await expect(page.getByRole("heading", { name: "Preferencias" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Silenciar Notificaciones" })).toBeVisible();
}

test.describe("Security - silenciar notificaciones", () => {
    test("envia codUsuario de la ruta (riesgo IDOR si backend no valida sesion)", async ({ page }) => {
        const { silenceRequests } = await setupMockApi(page);

        await openPreferences(page, "9999");
        await page.getByRole("button", { name: "Silenciar Notificaciones" }).click();
        await page.getByRole("button", { name: "Sí, silenciar" }).click();

        await expect.poll(() => silenceRequests.length).toBe(1);
        expect(silenceRequests[0]).toEqual({ codUsuario: "9999" });
    });

    test("no persiste estado local cuando backend falla al silenciar", async ({ page }) => {
        await setupMockApi(page, { silenceStatus: 500 });

        await openPreferences(page, "7");
        await page.getByRole("button", { name: "Silenciar Notificaciones" }).click();
        await page.getByRole("button", { name: "Sí, silenciar" }).click();

        await expect(page.getByText("Error del servidor: 500")).toBeVisible();
        const storage = await page.evaluate(() => window.localStorage.getItem("notificationsMute"));
        expect(storage).toBeNull();
    });

    test("reactivar limpia estado local y llama endpoint restore", async ({ page }) => {
        const { silenceRequests, activateRequests } = await setupMockApi(page);

        await openPreferences(page, "7");
        await page.getByRole("button", { name: "Silenciar Notificaciones" }).click();
        await page.getByRole("button", { name: "Sí, silenciar" }).click();

        await expect.poll(() => silenceRequests.length).toBe(1);
        await expect(page.getByText("Notificaciones silenciadas", { exact: true })).toBeVisible();

        const mutedStorage = await page.evaluate(() => window.localStorage.getItem("notificationsMute"));
        expect(mutedStorage).not.toBeNull();

        await page.getByRole("button", { name: "Reactivar notificaciones" }).click();

        await expect.poll(() => activateRequests.length).toBe(1);
        expect(activateRequests[0]).toEqual({ codUsuario: "7" });

        await expect.poll(async () => page.evaluate(() => window.localStorage.getItem("notificationsMute"))).toBeNull();
    });
});
