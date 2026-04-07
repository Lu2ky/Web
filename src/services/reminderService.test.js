import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function createResponse({ ok = true, status = 200, body = {} }) {
    const responseText = typeof body === "string" ? body : JSON.stringify(body);
    return {
        ok,
        status,
        text: vi.fn().mockResolvedValue(responseText),
    };
}

async function loadReminderService() {
    vi.resetModules();

    vi.stubEnv("VITE_API_UPDATE_REMINDER_UNIFIED", "http://api.local/api/update-reminder");
    vi.stubEnv("VITE_API_UPDATE_REMINDER", "http://api.local/api/update-name-reminder");
    vi.stubEnv("VITE_API_UPDATE_DESCRIPTION_REMINDER", "http://api.local/api/update-description-reminder");
    vi.stubEnv("VITE_API_UPDATE_DATE_REMINDER", "http://api.local/api/update-date-reminder");
    vi.stubEnv("VITE_API_UPDATE_PRIORITY_REMINDER", "http://api.local/api/update-priority-reminder");
    vi.stubEnv("VITE_API_UPDATE_STATE_REMINDER", "http://api.local/api/update-state-reminder");
    vi.stubEnv("VITE_API_UPDATE_TAGS_REMINDER", "http://api.local/api/update-tags-reminder");

    vi.doMock("./authSession", () => ({
        getSessionCodUsuario: () => "USR-001",
    }));

    const module = await import("./reminderService.jsx");
    return module.default;
}

async function loadReminderServiceWithEnv(envOverrides = {}) {
    vi.resetModules();

    vi.stubEnv("VITE_API_UPDATE_REMINDER_UNIFIED", envOverrides.unified ?? "http://api.local/api/update-reminder");
    vi.stubEnv("VITE_API_UPDATE_REMINDER", envOverrides.legacy ?? "http://api.local/api/update-name-reminder");
    vi.stubEnv("VITE_API_UPDATE_DESCRIPTION_REMINDER", "http://api.local/api/update-description-reminder");
    vi.stubEnv("VITE_API_UPDATE_DATE_REMINDER", "http://api.local/api/update-date-reminder");
    vi.stubEnv("VITE_API_UPDATE_PRIORITY_REMINDER", "http://api.local/api/update-priority-reminder");
    vi.stubEnv("VITE_API_UPDATE_STATE_REMINDER", "http://api.local/api/update-state-reminder");
    vi.stubEnv("VITE_API_UPDATE_TAGS_REMINDER", envOverrides.tags ?? "http://api.local/api/update-tags-reminder");

    vi.doMock("./authSession", () => ({
        getSessionCodUsuario: () => "USR-001",
    }));

    const module = await import("./reminderService.jsx");
    return module.default;
}

describe("ReminderService update methods", () => {
    beforeEach(() => {
        globalThis.fetch = vi.fn();
        vi.spyOn(console, "log").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllEnvs();
    });

    it("updateFromEdit usa POST primero en endpoint unificado", async () => {
        globalThis.fetch.mockResolvedValueOnce(createResponse({ ok: true, status: 200, body: { success: true } }));

        const ReminderService = await loadReminderService();

        await ReminderService.updateFromEdit(
            { id: 123 },
            {
                id: 123,
                name: "Tarea actualizada",
                description: "Descripcion",
                dueDate: "2026-04-07 14:30",
                priority: "alta",
                completed: false,
                tags: [{ label: "tesis", type: "custom" }],
            }
        );

        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        const [url, request] = globalThis.fetch.mock.calls[0];
        expect(url).toBe("http://api.local/api/update-reminder");
        expect(request.method).toBe("POST");

        const body = JSON.parse(request.body);
        expect(body).toMatchObject({
            P_idToDo: 123,
            P_nombre: "Tarea actualizada",
            P_descripcion: "Descripcion",
            codUsuario: "USR-001",
        });
    });

    it("updateState usa POST primero en endpoint unificado", async () => {
        globalThis.fetch.mockResolvedValueOnce(createResponse({ ok: true, status: 200, body: { success: true } }));

        const ReminderService = await loadReminderService();
        await ReminderService.updateState(55, true);

        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        const [url, request] = globalThis.fetch.mock.calls[0];
        expect(url).toBe("http://api.local/api/update-reminder");
        expect(request.method).toBe("POST");
        expect(JSON.parse(request.body)).toEqual({
            P_idToDo: 55,
            P_estado: true,
        });
    });

    it("updateName mantiene POST para endpoint heredado", async () => {
        globalThis.fetch.mockResolvedValueOnce(createResponse({ ok: true, status: 200, body: { success: true } }));

        const ReminderService = await loadReminderService();
        await ReminderService.updateName(77, "Nuevo titulo");

        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        const [url, request] = globalThis.fetch.mock.calls[0];
        expect(url).toBe("http://api.local/api/update-name-reminder");
        expect(request.method).toBe("POST");
    });

    it("normaliza espacios en endpoint unificado antes del fetch", async () => {
        globalThis.fetch.mockResolvedValueOnce(createResponse({ ok: true, status: 200, body: { success: true } }));

        const ReminderService = await loadReminderServiceWithEnv({
            unified: "  http://api.local/api/update-reminder  ",
        });

        await ReminderService.updateState(99, true);

        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        expect(globalThis.fetch.mock.calls[0][0]).toBe("http://api.local/api/update-reminder");
    });

    it("usa endpoint legacy cuando falta endpoint unificado", async () => {
        globalThis.fetch.mockResolvedValueOnce(createResponse({ ok: true, status: 200, body: { success: true } }));

        const ReminderService = await loadReminderServiceWithEnv({
            unified: "   ",
            legacy: "http://api.local/api/update-name-reminder",
        });

        await ReminderService.updateState(88, false);

        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        expect(globalThis.fetch.mock.calls[0][0]).toBe("http://api.local/api/update-name-reminder");
        expect(globalThis.fetch.mock.calls[0][1].method).toBe("POST");
    });

    it("updateFromEdit hace fallback a endpoint legacy cuando unificado responde success=false", async () => {
        globalThis.fetch
            .mockResolvedValueOnce(createResponse({ ok: true, status: 200, body: { success: false } }))
            .mockResolvedValueOnce(createResponse({ ok: true, status: 200, body: { success: false } }))
            .mockResolvedValueOnce(createResponse({ ok: true, status: 200, body: { success: true } }));

        const ReminderService = await loadReminderService();

        await ReminderService.updateFromEdit(
            {
                id: 321,
                name: "Titulo anterior",
                description: "Descripcion igual",
                dueDate: "2026-04-07 12:00:00",
                priority: "media",
                tags: [{ label: "tesis", type: "custom" }],
            },
            {
                id: 321,
                name: "Titulo nuevo",
                description: "Descripcion igual",
                dueDate: "2026-04-07 12:00:00",
                priority: "media",
                tags: [{ label: "tesis", type: "custom" }],
            }
        );

        expect(globalThis.fetch.mock.calls.length).toBeGreaterThanOrEqual(2);
        expect(globalThis.fetch.mock.calls[0][0]).toBe("http://api.local/api/update-reminder");
        const lastCall = globalThis.fetch.mock.calls[globalThis.fetch.mock.calls.length - 1];
        expect(lastCall[0]).toBe("http://api.local/api/update-name-reminder");

        const legacyBody = JSON.parse(lastCall[1].body);
        expect(legacyBody).toMatchObject({
            P_idToDo: 321,
            P_nombre: "Titulo nuevo",
        });
    });

    it("updateTags reintenta con endpoint sin slash cuando el primero responde 404", async () => {
        globalThis.fetch
            .mockResolvedValueOnce(createResponse({
                ok: false,
                status: 404,
                body: "Cannot POST /api/update-tags-reminder/",
            }))
            .mockResolvedValueOnce(createResponse({ ok: true, status: 200, body: { success: true } }));

        const ReminderService = await loadReminderServiceWithEnv({
            tags: "http://api.local/api/update-tags-reminder/",
        });

        await ReminderService.updateTags(12, ["tesis"]);

        expect(globalThis.fetch).toHaveBeenCalledTimes(2);
        expect(globalThis.fetch.mock.calls[0][0]).toBe("http://api.local/api/update-tags-reminder/");
        expect(globalThis.fetch.mock.calls[1][0]).toBe("http://api.local/api/update-tags-reminder");
    });

    it("updateFromEdit no falla cuando tags da 404 pero otros cambios ya se aplicaron", async () => {
        globalThis.fetch
            // updateFromEdit: endpoint unificado falla en ambas variantes
            .mockResolvedValueOnce(createResponse({ ok: true, status: 200, body: { success: false } }))
            .mockResolvedValueOnce(createResponse({ ok: true, status: 200, body: { success: false } }))
            // fallback: updateName exitoso
            .mockResolvedValueOnce(createResponse({ ok: true, status: 200, body: { success: true } }))
            // fallback: updateTags falla en ambas variantes con 404
            .mockResolvedValueOnce(createResponse({ ok: false, status: 404, body: "Cannot POST /api/update-tags-reminder" }))
            .mockResolvedValueOnce(createResponse({ ok: false, status: 404, body: "Cannot POST /api/update-tags-reminder/" }));

        const ReminderService = await loadReminderService();

        await expect(
            ReminderService.updateFromEdit(
                {
                    id: 808,
                    name: "Titulo viejo",
                    description: "Desc",
                    dueDate: "2026-04-07 12:00:00",
                    priority: "media",
                    tags: [{ label: "tesis", type: "custom" }],
                },
                {
                    id: 808,
                    name: "Titulo nuevo",
                    description: "Desc",
                    dueDate: "2026-04-07 12:00:00",
                    priority: "media",
                    tags: [{ label: "investigacion", type: "custom" }],
                }
            )
        ).resolves.toBeUndefined();

        expect(globalThis.fetch.mock.calls.length).toBe(5);
        expect(globalThis.fetch.mock.calls[2][0]).toBe("http://api.local/api/update-name-reminder");
    });

    it("updateFromEdit no llama API cuando no hay cambios", async () => {
        const ReminderService = await loadReminderService();

        await ReminderService.updateFromEdit(
            {
                id: 900,
                name: "Titulo",
                description: "Desc",
                dueDate: "2026-04-07 12:00:00",
                priority: "media",
                tags: [{ label: "tesis", type: "custom" }],
            },
            {
                id: 900,
                name: "Titulo",
                description: "Desc",
                dueDate: "2026-04-07 12:00:00",
                priority: "media",
                tags: [{ label: "tesis", type: "custom" }],
            }
        );

        expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it("deleteReminder reintenta con payload alternativo cuando backend responde success=false", async () => {
        globalThis.fetch
            .mockResolvedValueOnce(createResponse({ ok: true, status: 200, body: { success: false } }))
            .mockResolvedValueOnce(createResponse({ ok: true, status: 200, body: { success: false } }))
            .mockResolvedValueOnce(createResponse({ ok: true, status: 200, body: { success: true } }));

        const ReminderService = await loadReminderService();

        await ReminderService.deleteReminder(77, 1234);

        expect(globalThis.fetch.mock.calls.length).toBeGreaterThanOrEqual(2);
        const firstPayload = JSON.parse(globalThis.fetch.mock.calls[0][1].body);
        const allPayloads = globalThis.fetch.mock.calls.map(call => JSON.parse(call[1].body));
        const hasPayloadWithUserId = allPayloads.some(payload => payload?.idUsuario === 1234);

        expect(firstPayload).toMatchObject({ N_idRecordatorio: 77, codUsuario: "USR-001" });
        expect(hasPayloadWithUserId).toBe(true);
    });
});
