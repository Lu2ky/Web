import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

function createResponse({ ok, status = 200, body = "" }) {
    const textBody = typeof body === "string" ? body : JSON.stringify(body);
    return {
        ok,
        status,
        text: vi.fn().mockResolvedValue(textBody),
    };
}

async function loadSilenceService({ silenceEndpoint, activateEndpoint }) {
    vi.resetModules();
    vi.stubEnv("VITE_API_NOTIFICATIONS_SILENCE", silenceEndpoint ?? "");
    vi.stubEnv("VITE_API_NOTIFICATIONS_ACTIVATE", activateEndpoint ?? "");
    return import("./notificationsSilenceService.jsx");
}

describe("notificationsSilenceService - unitarias", () => {
    beforeEach(() => {
        localStorage.clear();
        globalThis.fetch = vi.fn();
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllEnvs();
    });

    it("silenceNotifications retorna error cuando no hay userId", async () => {
        const service = await loadSilenceService({
            silenceEndpoint: "http://api.local/api/stop-all-notifications",
            activateEndpoint: "http://api.local/api/restore-notifications",
        });

        const result = await service.silenceNotifications("");

        expect(result).toEqual({ success: false, error: "Usuario no disponible" });
        expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it("silenceNotifications guarda estado cuando backend responde OK con muteUntil", async () => {
        globalThis.fetch.mockResolvedValueOnce(
            createResponse({ ok: true, status: 200, body: { muteUntil: Date.now() + 1000 * 60 } })
        );

        const service = await loadSilenceService({
            silenceEndpoint: "http://api.local/api/stop-all-notifications",
            activateEndpoint: "http://api.local/api/restore-notifications",
        });

        const result = await service.silenceNotifications(123);

        expect(result.success).toBe(true);
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        const [url, request] = globalThis.fetch.mock.calls[0];
        expect(url).toBe("http://api.local/api/stop-all-notifications");
        expect(request.method).toBe("POST");
        expect(JSON.parse(request.body)).toEqual({ codUsuario: "123" });

        const stored = JSON.parse(localStorage.getItem("notificationsMute"));
        expect(stored.enabled).toBe(true);
        expect(stored.userId).toBe(123);
        expect(Number.isFinite(stored.muteUntil)).toBe(true);
    });

    it("activateNotifications limpia estado local cuando backend responde OK", async () => {
        localStorage.setItem("notificationsMute", JSON.stringify({ enabled: true, userId: 123 }));
        globalThis.fetch.mockResolvedValueOnce(createResponse({ ok: true, status: 200, body: { success: true } }));

        const service = await loadSilenceService({
            silenceEndpoint: "http://api.local/api/stop-all-notifications",
            activateEndpoint: "http://api.local/api/restore-notifications",
        });

        const result = await service.activateNotifications(123);

        expect(result.success).toBe(true);
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        expect(localStorage.getItem("notificationsMute")).toBeNull();
    });
});

describe("notificationsSilenceService - seguridad y robustez", () => {
    beforeEach(() => {
        localStorage.clear();
        globalThis.fetch = vi.fn();
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllEnvs();
    });

    it("silenceNotifications no persiste estado cuando backend responde error", async () => {
        globalThis.fetch.mockResolvedValueOnce(createResponse({ ok: false, status: 500, body: "fail" }));

        const service = await loadSilenceService({
            silenceEndpoint: "http://api.local/api/stop-all-notifications",
            activateEndpoint: "http://api.local/api/restore-notifications",
        });

        const result = await service.silenceNotifications(123);

        expect(result.success).toBe(false);
        expect(localStorage.getItem("notificationsMute")).toBeNull();
    });

    it("silenceNotifications soporta body vacio sin lanzar excepcion", async () => {
        globalThis.fetch.mockResolvedValueOnce(createResponse({ ok: true, status: 200, body: "" }));

        const service = await loadSilenceService({
            silenceEndpoint: "http://api.local/api/stop-all-notifications",
            activateEndpoint: "http://api.local/api/restore-notifications",
        });

        const result = await service.silenceNotifications(456);

        expect(result.success).toBe(true);
        const stored = JSON.parse(localStorage.getItem("notificationsMute"));
        expect(stored).toMatchObject({
            enabled: true,
            userId: 456,
            muteUntil: null,
        });
    });

    it("getMuteStatus elimina entradas expiradas", async () => {
        const service = await loadSilenceService({
            silenceEndpoint: "http://api.local/api/stop-all-notifications",
            activateEndpoint: "http://api.local/api/restore-notifications",
        });

        localStorage.setItem(
            "notificationsMute",
            JSON.stringify({ enabled: true, muteUntil: Date.now() - 5000, userId: 1 })
        );

        const status = service.getMuteStatus();

        expect(status).toBeNull();
        expect(localStorage.getItem("notificationsMute")).toBeNull();
    });

    it("getMuteStatus tolera localStorage malformado y retorna null", async () => {
        const service = await loadSilenceService({
            silenceEndpoint: "http://api.local/api/stop-all-notifications",
            activateEndpoint: "http://api.local/api/restore-notifications",
        });

        localStorage.setItem("notificationsMute", "{json-invalido");

        const status = service.getMuteStatus();

        expect(status).toBeNull();
    });

    it("getMuteStatus conserva compatibilidad con enabled true sin muteUntil", async () => {
        const service = await loadSilenceService({
            silenceEndpoint: "http://api.local/api/stop-all-notifications",
            activateEndpoint: "http://api.local/api/restore-notifications",
        });

        localStorage.setItem("notificationsMute", JSON.stringify({ enabled: true, userId: 99 }));

        const status = service.getMuteStatus();

        expect(status).toMatchObject({ enabled: true, userId: 99 });
        expect(service.isNotificationsMuted()).toBe(true);
    });
});
