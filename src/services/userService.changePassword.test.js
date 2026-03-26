import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

function createResponse({
    ok,
    status,
    body,
    contentType = "application/json",
}) {
    return {
        ok,
        status,
        headers: {
            get: (name) => (String(name).toLowerCase() === "content-type" ? contentType : ""),
        },
        json: vi.fn().mockResolvedValue(body),
        text: vi.fn().mockResolvedValue(typeof body === "string" ? body : JSON.stringify(body)),
    };
}

async function loadUserServiceWithEndpoint(endpoint) {
    vi.resetModules();

    if (endpoint) {
        vi.stubEnv("VITE_API_CHANGE_PASSWORD", endpoint);
    } else {
        vi.stubEnv("VITE_API_CHANGE_PASSWORD", "");
    }

    vi.stubEnv("VITE_API_PASSWORD_CHANGE", "");
    return import("./userService.jsx");
}

describe("userService.changePassword", () => {
    beforeEach(() => {
        globalThis.fetch = vi.fn();
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllEnvs();
    });

    it("retorna null cuando faltan parametros obligatorios", async () => {
        const { changePassword } = await loadUserServiceWithEndpoint("http://api.local/api/change-password");

        const result = await changePassword(null, "Actual#123", "Nueva#123");

        expect(result).toBeNull();
        expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it("retorna null cuando no hay endpoint configurado", async () => {
        const { changePassword } = await loadUserServiceWithEndpoint("");

        const result = await changePassword(123, "Actual#123", "Nueva#123");

        expect(result).toBeNull();
        expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it("retorna error de politica y no hace request cuando la clave no cumple complejidad", async () => {
        const { changePassword } = await loadUserServiceWithEndpoint("http://api.local/api/change-password");

        const result = await changePassword(123, "Actual#123", "corta");

        expect(result).toEqual({
            success: false,
            message: "La contraseña debe tener al menos 8 caracteres",
        });
        expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it("envia payload esperado y retorna exito con respuesta JSON", async () => {
        globalThis.fetch.mockResolvedValueOnce(
            createResponse({ ok: true, status: 200, body: { success: true, status: "success" } })
        );

        const { changePassword } = await loadUserServiceWithEndpoint("http://api.local/api/change-password");
        const result = await changePassword(123, "Actual#123", "Nueva#123");

        expect(result).toEqual({ success: true, status: "success" });
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);

        const [url, request] = globalThis.fetch.mock.calls[0];
        expect(url).toBe("http://api.local/api/change-password");
        expect(request.method).toBe("POST");
        expect(JSON.parse(request.body)).toEqual({
            user: "123",
            pass: "Nueva#123",
        });
    });

    it("hace fallback de metodo cuando POST retorna 405", async () => {
        globalThis.fetch
            .mockResolvedValueOnce(createResponse({ ok: false, status: 405, body: { message: "Method Not Allowed" } }))
            .mockResolvedValueOnce(createResponse({ ok: true, status: 200, body: { success: true } }));

        const { changePassword } = await loadUserServiceWithEndpoint("http://api.local/api/change-password");
        const result = await changePassword(123, "Actual#123", "Nueva#123");

        expect(result).toEqual({ success: true });
        expect(globalThis.fetch).toHaveBeenCalledTimes(2);
        expect(globalThis.fetch.mock.calls[0][1].method).toBe("POST");
        expect(globalThis.fetch.mock.calls[1][1].method).toBe("PUT");
    });

    it("hace fallback de endpoint legacy al endpoint moderno", async () => {
        globalThis.fetch
            .mockResolvedValueOnce(createResponse({ ok: false, status: 404, body: { message: "not found" } }))
            .mockResolvedValueOnce(createResponse({ ok: false, status: 405, body: { message: "method" } }))
            .mockResolvedValueOnce(createResponse({ ok: false, status: 404, body: { message: "not found" } }))
            .mockResolvedValueOnce(createResponse({ ok: false, status: 405, body: { message: "method" } }))
            .mockResolvedValueOnce(createResponse({ ok: true, status: 200, body: { success: true } }));

        const { changePassword } = await loadUserServiceWithEndpoint("http://api.local/api/change-password");
        const result = await changePassword(123, "Actual#123", "Nueva#123");

        expect(result).toEqual({ success: true });
        expect(globalThis.fetch).toHaveBeenCalledTimes(5);

        const finalUrl = globalThis.fetch.mock.calls[4][0];
        expect(finalUrl).toContain("/api/auth/changepassword");
    });

    it("retorna error formateado cuando backend responde error no recuperable", async () => {
        globalThis.fetch.mockResolvedValueOnce(
            createResponse({ ok: false, status: 500, body: { message: "backend fail" } })
        );

        const { changePassword } = await loadUserServiceWithEndpoint("http://api.local/api/change-password");
        const result = await changePassword(123, "Actual#123", "Nueva#123");

        expect(result).toEqual({
            success: false,
            message: "backend fail",
        });
    });

    it("retorna exito parseando respuesta de texto", async () => {
        globalThis.fetch.mockResolvedValueOnce(
            createResponse({ ok: true, status: 200, body: "OK", contentType: "text/plain" })
        );

        const { changePassword } = await loadUserServiceWithEndpoint("http://api.local/api/change-password");
        const result = await changePassword(123, "Actual#123", "Nueva#123");

        expect(result).toEqual({ success: true, message: "OK" });
    });

    it("retorna error controlado cuando fetch lanza excepcion", async () => {
        globalThis.fetch.mockRejectedValueOnce(new Error("timeout"));

        const { changePassword } = await loadUserServiceWithEndpoint("http://api.local/api/change-password");
        const result = await changePassword(123, "Actual#123", "Nueva#123");

        expect(result).toEqual({
            success: false,
            message: "timeout",
        });
    });
});
