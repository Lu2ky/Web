import { test, expect } from "@playwright/test";

async function seedAuthSession(page, userId) {
    await page.addInitScript((session) => {
        window.localStorage.setItem("auth_session", JSON.stringify(session));
        window.localStorage.setItem(
            `onboarding_visited:${session.userId}`,
            JSON.stringify({
                completed: true,
                version: 1,
                completedAt: Date.now(),
            })
        );
    }, {
        userId: String(userId),
        token: "test-token",
        roles: ["Usuarios"],
        createdAt: Date.now(),
    });
}

async function setupMockApi(page) {
    const silenceRequests = [];
    const activateRequests = [];

    await page.route("**/*", async (route) => {
        const request = route.request();
        const resourceType = request.resourceType();

        if (resourceType !== "fetch" && resourceType !== "xhr") {
            await route.continue();
            return;
        }

        const url = request.url();

        if (url.includes("/api/stop-all-notifications")) {
            silenceRequests.push(JSON.parse(request.postData() || "{}"));
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ muteUntil: Date.now() + 10 * 60 * 1000 }),
            });
            return;
        }

        if (url.includes("/api/restore-notifications")) {
            activateRequests.push(JSON.parse(request.postData() || "{}"));
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ success: true }),
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
                        idUsuario: 123,
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
}

test.describe("E2E Preferencias - notificaciones", () => {
    test("usuario puede silenciar notificaciones", async ({ page }) => {
        const { silenceRequests } = await setupMockApi(page);
        await openPreferences(page, "123");

        await page.getByRole("button", { name: "Silenciar Notificaciones" }).click();
        await page.getByRole("button", { name: "Sí, silenciar" }).click();

        await expect.poll(() => silenceRequests.length).toBe(1);
        expect(silenceRequests[0]).toEqual({ codUsuario: "123" });

        await expect(page.getByText("Notificaciones silenciadas", { exact: true })).toBeVisible();
        await expect(page.getByText("Notificaciones silenciadas correctamente")).toBeVisible();

        const localMute = await page.evaluate(() => window.localStorage.getItem("notificationsMute"));
        expect(localMute).not.toBeNull();
    });

    test("usuario puede reactivar notificaciones", async ({ page }) => {
        const { silenceRequests, activateRequests } = await setupMockApi(page);
        await openPreferences(page, "123");

        await page.getByRole("button", { name: "Silenciar Notificaciones" }).click();
        await page.getByRole("button", { name: "Sí, silenciar" }).click();

        await expect.poll(() => silenceRequests.length).toBe(1);
        await expect(page.getByRole("button", { name: "Reactivar notificaciones" })).toBeVisible();

        await page.getByRole("button", { name: "Reactivar notificaciones" }).click();

        await expect.poll(() => activateRequests.length).toBe(1);
        expect(activateRequests[0]).toEqual({ codUsuario: "123" });

        await expect(page.getByRole("button", { name: "Silenciar Notificaciones" })).toBeVisible();
        await expect(page.getByText("Notificaciones reactivadas correctamente")).toBeVisible();
        await expect.poll(async () => page.evaluate(() => window.localStorage.getItem("notificationsMute"))).toBeNull();
    });

    test("estado silenciado persiste tras recargar pagina", async ({ page }) => {
        const { silenceRequests } = await setupMockApi(page);
        await openPreferences(page, "123");

        await page.getByRole("button", { name: "Silenciar Notificaciones" }).click();
        await page.getByRole("button", { name: "Sí, silenciar" }).click();

        await expect.poll(() => silenceRequests.length).toBe(1);
        await expect(page.getByText("Notificaciones silenciadas", { exact: true })).toBeVisible();

        await page.reload();
        await expect(page.getByRole("heading", { name: "UPB Planner" })).toBeVisible();

        await page.locator(".dropdown-image-button").click();
        await page.getByRole("button", { name: "Preferencias" }).click();

        await expect(page.getByRole("heading", { name: "Preferencias" })).toBeVisible();
        await expect(page.getByText("Notificaciones silenciadas", { exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: "Reactivar notificaciones" })).toBeVisible();

        const localMute = await page.evaluate(() => window.localStorage.getItem("notificationsMute"));
        expect(localMute).not.toBeNull();
    });
});
