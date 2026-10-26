import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import MessageConfirmation from "./MessageConfirmation";

function DialogHost() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Eliminar actividad
      </button>
      <MessageConfirmation
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
        title="¿Eliminar actividad?"
        description="Esta acción no se puede deshacer."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
}

describe("MessageConfirmation", () => {
  it("no renderiza nada cuando está cerrado", () => {
    render(<MessageConfirmation isOpen={false} onClose={() => {}} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("se anuncia como diálogo modal con título y descripción", () => {
    render(
      <MessageConfirmation
        isOpen
        onClose={() => {}}
        title="¿Eliminar actividad?"
        description="Esta acción no se puede deshacer."
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "¿Eliminar actividad?" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleDescription("Esta acción no se puede deshacer.");
  });

  it("enfoca cancelar al abrir, cierra con Escape y restaura el foco", async () => {
    render(<DialogHost />);

    await userEvent.click(screen.getByRole("button", { name: "Eliminar actividad" }));
    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Eliminar actividad" })).toHaveFocus();
  });

  it("mantiene el foco dentro del diálogo con Tab", async () => {
    render(<MessageConfirmation isOpen onClose={() => {}} confirmText="Sí, eliminar" cancelText="Cancelar" />);

    const close = screen.getByRole("button", { name: "Cerrar" });
    const cancel = screen.getByRole("button", { name: "Cancelar" });
    const confirm = screen.getByRole("button", { name: "Sí, eliminar" });

    cancel.focus();
    await userEvent.tab({ shift: true });
    expect(close).toHaveFocus();

    confirm.focus();
    await userEvent.tab();
    expect(close).toHaveFocus();
  });

  it("confirma con el botón de acción", async () => {
    const onConfirm = vi.fn();
    render(<MessageConfirmation isOpen onClose={() => {}} onConfirm={onConfirm} confirmText="Sí, eliminar" />);

    await userEvent.click(screen.getByRole("button", { name: "Sí, eliminar" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
