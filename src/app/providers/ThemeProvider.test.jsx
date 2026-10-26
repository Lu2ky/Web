import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider } from "./ThemeProvider";
import { useAppearance } from "../../shared/appearance/appearanceContext";
import { APPEARANCE_STORAGE_KEY } from "../../shared/storage/appearance";

function AppearanceProbe() {
  const { theme, fontSize, resolvedTheme, setTheme, setFontSize } = useAppearance();
  return (
    <div>
      <p>{`tema:${theme} resuelto:${resolvedTheme} letra:${fontSize}`}</p>
      <button type="button" onClick={() => setTheme("dark")}>oscuro</button>
      <button type="button" onClick={() => setFontSize("lg")}>grande</button>
    </div>
  );
}

function renderProvider() {
  return render(
    <ThemeProvider>
      <AppearanceProbe />
    </ThemeProvider>,
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-font-size");
  });

  it("aplica los valores por defecto al montar", async () => {
    renderProvider();

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("light"));
    expect(document.documentElement.dataset.fontSize).toBe("md");
  });

  it("cambia el tema y lo persiste en localStorage", async () => {
    renderProvider();
    await userEvent.click(screen.getByRole("button", { name: "oscuro" }));

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    expect(JSON.parse(localStorage.getItem(APPEARANCE_STORAGE_KEY))).toMatchObject({
      theme: "dark",
    });
    expect(screen.getByText(/tema:dark resuelto:dark/)).toBeInTheDocument();
  });

  it("cambia el tamaño de letra y lo persiste", async () => {
    renderProvider();
    await userEvent.click(screen.getByRole("button", { name: "grande" }));

    await waitFor(() => expect(document.documentElement.dataset.fontSize).toBe("lg"));
    expect(JSON.parse(localStorage.getItem(APPEARANCE_STORAGE_KEY))).toMatchObject({
      fontSize: "lg",
    });
  });

  it("recupera la apariencia guardada antes de montar", async () => {
    localStorage.setItem(
      APPEARANCE_STORAGE_KEY,
      JSON.stringify({ theme: "dark", fontSize: "sm" }),
    );

    renderProvider();

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    expect(document.documentElement.dataset.fontSize).toBe("sm");
  });
});
