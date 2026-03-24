import { test, expect } from "@playwright/test";

async function seedAuthSession(page, userId) {
    await page.addInitScript((session) => {
        window.localStorage.setItem("auth_session", JSON.stringify(session));
    }, {
        userId: String(userId),
        token: "test-token",
        roles: ["Usuarios"],
        createdAt: Date.now(),
    });
}

async function setupMockApi(page, options = {}) {
    const changePasswordRequests = [];
    const changePasswordResponseBody = options.changePasswordResponseBody ?? { success: true };
    const changePasswordStatus = options.changePasswordStatus ?? 200;

    await page.route("**/*", async (route) => {
        const request = route.request();
        const resourceType = request.resourceType();

        if (resourceType !== "fetch" && resourceType !== "xhr") {
            await route.continue();
            return;
        }

        const url = request.url();

        if (url.includes("/api/auth/changepassword") || url.includes("/api/change-password")) {
            const rawBody = request.postData() || "{}";
            let payload = {};
            try {
                payload = JSON.parse(rawBody);
            } catch {
                payload = { unparsable: rawBody };
            }
            changePasswordRequests.push(payload);

            await route.fulfill({
                status: changePasswordStatus,
                contentType: "application/json",
                body: JSON.stringify(changePasswordResponseBody),
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

    return { changePasswordRequests };
}

async function openProfile(page, userId) {
    await seedAuthSession(page, userId);
    await page.goto(`/App/${userId}`);
    await expect(page.getByRole("heading", { name: "UPB Planner" })).toBeVisible();

    await page.locator(".dropdown-image-button").click();
    await page.getByRole("button", { name: "Mi Perfil" }).click();

    await expect(page.getByRole("heading", { name: "Mi Perfil" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cambiar Contrase\u00f1a" })).toBeVisible();
}

async function submitChange(page, currentPassword, newPassword, confirmPassword) {
    await page.getByLabel("Contrase\u00f1a Actual").fill(currentPassword);
    await page.getByLabel(/^Nueva Contrase\u00f1a$/).fill(newPassword);
    await page.getByLabel(/^Confirmar Nueva Contrase\u00f1a$/).fill(confirmPassword);
    await page.getByRole("button", { name: "Cambiar Contrase\u00f1a" }).click();
}

test.describe("Security - cambio de contrasena", () => {
    test("riesgo IDOR: userId manipulable desde ruta", async ({ page }) => {
        const { changePasswordRequests } = await setupMockApi(page);

        await openProfile(page, "9999");
        await submitChange(page, "Actual123", "Nueva#123", "Nueva#123");

        await expect.poll(() => changePasswordRequests.length).toBe(1);
        expect(changePasswordRequests[0].user).toBe("9999");
    });

    test("politica fuerte: rechaza contrasena sin mayuscula, numero y simbolo", async ({ page }) => {
        const { changePasswordRequests } = await setupMockApi(page);

        await openProfile(page, "7");
        await submitChange(page, "Actual123", "abcdefgh", "abcdefgh");

        await expect.poll(() => changePasswordRequests.length).toBe(0);
        await expect(page.getByText("La contraseña debe incluir al menos una letra mayúscula")).toBeVisible();
    });

    test("sin control anti-automatizacion en cliente: multiples intentos consecutivos", async ({ page }) => {
        const { changePasswordRequests } = await setupMockApi(page, {
            changePasswordResponseBody: { success: false, message: "Credenciales invalidas" },
            changePasswordStatus: 200,
        });

        await openProfile(page, "7");
        await submitChange(page, "Actual123", "Nueva#123", "Nueva#123");

        for (let i = 0; i < 4; i += 1) {
            await page.getByRole("button", { name: "Cambiar Contrase\u00f1a" }).click();
        }

        await expect.poll(() => changePasswordRequests.length).toBe(5);
        await expect(page.getByText("Credenciales invalidas")).toBeVisible();
    });
});
