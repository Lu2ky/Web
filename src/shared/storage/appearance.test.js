import { beforeEach, describe, expect, it } from "vitest";
import {
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE,
  applyAppearance,
  normalizeAppearance,
  readAppearance,
  resolveTheme,
  writeAppearance,
} from "./appearance";

describe("appearance storage", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-font-size");
    document.documentElement.style.colorScheme = "";
  });

  it("normaliza valores desconocidos a los valores por defecto", () => {
    expect(normalizeAppearance(null)).toEqual(DEFAULT_APPEARANCE);
    expect(normalizeAppearance({ theme: "neon", fontSize: "xl" })).toEqual(DEFAULT_APPEARANCE);
    expect(normalizeAppearance({ theme: "dark", fontSize: "lg" })).toEqual({
      theme: "dark",
      fontSize: "lg",
    });
  });

  it("lee valores por defecto si no hay nada guardado o el JSON es inválido", () => {
    expect(readAppearance()).toEqual(DEFAULT_APPEARANCE);

    localStorage.setItem(APPEARANCE_STORAGE_KEY, "{no-json");
    expect(readAppearance()).toEqual(DEFAULT_APPEARANCE);
  });

  it("persiste y recupera la apariencia", () => {
    writeAppearance({ theme: "light", fontSize: "sm" });
    expect(JSON.parse(localStorage.getItem(APPEARANCE_STORAGE_KEY))).toEqual({
      theme: "light",
      fontSize: "sm",
    });
    expect(readAppearance()).toEqual({ theme: "light", fontSize: "sm" });
  });

  it("resuelve el tema automático con el tema del sistema", () => {
    expect(resolveTheme("auto", "dark")).toBe("dark");
    expect(resolveTheme("auto", "light")).toBe("light");
    expect(resolveTheme("light", "dark")).toBe("light");
    expect(resolveTheme("dark", "light")).toBe("dark");
  });

  it("escribe data-theme y data-font-size en <html>", () => {
    applyAppearance({ theme: "dark", fontSize: "lg" }, "light");

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.dataset.fontSize).toBe("lg");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });
});
