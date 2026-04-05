import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

function createResponse({ ok, status, body }) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body)
  };
}

async function loadServiceWithEndpoint(endpoint) {
  vi.resetModules();
  vi.stubEnv("VITE_API_ADD_ACADEMIC_PERIOD", endpoint || "");
  return import("./academicPeriodsService.jsx");
}

describe("academicPeriodsService.createAcademicPeriod", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("retorna error si no hay endpoint configurado", async () => {
    const { createAcademicPeriod } = await loadServiceWithEndpoint("");

    const result = await createAcademicPeriod({
      idUsuario: "100",
      nombre: "2026-10",
      fechaInicio: "2026-01-10",
      fechaFinal: "2026-06-20"
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("VITE_API_ADD_ACADEMIC_PERIOD");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("retorna error cuando faltan campos obligatorios", async () => {
    const { createAcademicPeriod } = await loadServiceWithEndpoint("http://api.local/insert");

    const result = await createAcademicPeriod({
      idUsuario: "",
      nombre: "2026-10",
      fechaInicio: "2026-01-10",
      fechaFinal: "2026-06-20"
    });

    expect(result).toEqual({
      success: false,
      message: "Faltan campos obligatorios para crear el período"
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("envia payload esperado y retorna exito", async () => {
    globalThis.fetch.mockResolvedValueOnce(
      createResponse({ ok: true, status: 201, body: { message: "Periodo creado" } })
    );

    const { createAcademicPeriod } = await loadServiceWithEndpoint("http://api.local/insert");

    const result = await createAcademicPeriod({
      idUsuario: "501",
      nombre: "2026-10",
      fechaInicio: "2026-01-10",
      fechaFinal: "2026-06-20"
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe("Periodo creado");
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    const [url, request] = globalThis.fetch.mock.calls[0];
    expect(url).toBe("http://api.local/insert");
    expect(request.method).toBe("POST");
    expect(JSON.parse(request.body)).toEqual({
      idUsuario: "501",
      nombre: "2026-10",
      fechaInicio: "2026-01-10",
      fechaFinal: "2026-06-20"
    });
  });

  it("propaga error de backend cuando la respuesta no es OK", async () => {
    globalThis.fetch.mockResolvedValueOnce(
      createResponse({ ok: false, status: 400, body: { message: "Periodo duplicado" } })
    );

    const { createAcademicPeriod } = await loadServiceWithEndpoint("http://api.local/insert");

    const result = await createAcademicPeriod({
      idUsuario: "501",
      nombre: "2026-10",
      fechaInicio: "2026-01-10",
      fechaFinal: "2026-06-20"
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe("Periodo duplicado");
  });

  it("retorna error controlado cuando fetch falla", async () => {
    globalThis.fetch.mockRejectedValueOnce(new Error("network down"));

    const { createAcademicPeriod } = await loadServiceWithEndpoint("http://api.local/insert");

    const result = await createAcademicPeriod({
      idUsuario: "501",
      nombre: "2026-10",
      fechaInicio: "2026-01-10",
      fechaFinal: "2026-06-20"
    });

    expect(result).toEqual({
      success: false,
      message: "network down"
    });
  });
});
