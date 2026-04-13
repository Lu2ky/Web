import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskAddModal from "./TaskAddModal";

vi.mock("../../services/tagsService", () => ({
    getTagsByUser: vi.fn().mockResolvedValue([]),
}));

describe("TaskAddModal validation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("bloquea el guardado cuando la fecha u hora ya pasó", async () => {
        const onSave = vi.fn();
        const onClose = vi.fn();
        const now = new Date();
        const past = new Date(now.getTime() - 60_000);
        const dateValue = `${String(past.getDate()).padStart(2, "0")}/${String(past.getMonth() + 1).padStart(2, "0")}/${past.getFullYear()}`;
        const timeValue = `${String(past.getHours()).padStart(2, "0")}:${String(past.getMinutes()).padStart(2, "0")}`;

        const { container } = render(
            <TaskAddModal
                isOpen={true}
                onClose={onClose}
                onSave={onSave}
                userId="7"
            />
        );

        fireEvent.change(screen.getByPlaceholderText("Nombre del recordatorio"), {
            target: { value: "Tarea con fecha pasada" },
        });

        fireEvent.change(screen.getByPlaceholderText("dd/mm/aaaa"), {
            target: { value: dateValue },
        });

        fireEvent.change(container.querySelector('input[type="time"]'), {
            target: { value: timeValue },
        });

        fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

        expect(await screen.findByText("No puedes poner una hora o día que ya pasó")).toBeInTheDocument();
        expect(onSave).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
    });
});