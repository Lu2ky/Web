import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BlockPersonal } from "./BlockPersonal";

const baseProps = {
  id: 7,
  name: "Estudiar cálculo",
  description: "Repasar derivadas",
  tag: "Personal",
};

describe("BlockPersonal", () => {
  it("expone la tarjeta como botón accesible", () => {
    render(<BlockPersonal {...baseProps} />);

    const card = screen.getByRole("button", {
      name: /Estudiar cálculo Repasar derivadas Personal Abrir detalles de la actividad/,
    });
    expect(card.tagName).toBe("BUTTON");
    expect(card).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("abre los detalles con Enter y con Espacio", async () => {
    const onClick = vi.fn();
    render(<BlockPersonal {...baseProps} onClick={onClick} />);

    const card = screen.getByRole("button", { name: /Abrir detalles/ });
    card.focus();

    await userEvent.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);

    await userEvent.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("elimina sin disparar la apertura de detalles", async () => {
    const onClick = vi.fn();
    const onDelete = vi.fn();
    render(<BlockPersonal {...baseProps} onClick={onClick} onDelete={onDelete} />);

    await userEvent.click(screen.getByRole("button", { name: "Eliminar Estudiar cálculo" }));

    expect(onDelete).toHaveBeenCalledWith(7);
    expect(onClick).not.toHaveBeenCalled();
  });
});
