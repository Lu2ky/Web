import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider } from "../../../../app/providers/ThemeProvider";
import AppearanceSettings from "./AppearanceSettings";
import { APPEARANCE_STORAGE_KEY } from "../../../../shared/storage/appearance";

function renderSettings() {
  return render(
    <ThemeProvider>
      <AppearanceSettings />
    </ThemeProvider>,
  );
}

describe("AppearanceSettings", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-font-size");
  });

  it("permite elegir el tema con radios accesibles", async () => {
    renderSettings();

    const dark = screen.getByRole("radio", { name: /Oscuro/ });
    expect(screen.getByRole("radio", { name: /Automático/ })).toBeChecked();

    await userEvent.click(dark);

    expect(dark).toBeChecked();
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    expect(JSON.parse(localStorage.getItem(APPEARANCE_STORAGE_KEY))).toMatchObject({
      theme: "dark",
    });
  });

  it("cambia el tamaño de letra y anuncia el resultado", async () => {
    renderSettings();

    await userEvent.click(screen.getByRole("radio", { name: /Grande/ }));

    await waitFor(() => expect(document.documentElement.dataset.fontSize).toBe("lg"));
    expect(screen.getByRole("status")).toHaveTextContent(/Tamaño de letra Grande/);
  });

  it("restablece la apariencia por defecto", async () => {
    renderSettings();
    await userEvent.click(screen.getByRole("radio", { name: /Oscuro/ }));
    await userEvent.click(screen.getByRole("button", { name: "Restablecer apariencia" }));

    expect(screen.getByRole("radio", { name: /Automático/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Mediana/ })).toBeChecked();
    expect(JSON.parse(localStorage.getItem(APPEARANCE_STORAGE_KEY))).toEqual({
      theme: "auto",
      fontSize: "md",
    });
  });
});
