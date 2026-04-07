import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ToDoList from "./ToDoList";
import ReminderService from "../../services/reminderService";
import { getUserData } from "../../services/userService";

let nextDuplicatePayload = {
    name: "Tarea duplicada",
    description: "Descripcion duplicada",
    dueDate: "2026-04-01 09:30:00",
    priority: "media",
    tags: [
        { label: "priority-high", type: "priority-high" },
        { label: "academico", type: "custom" },
    ],
};

vi.mock("./ToDoListTagFetcher", () => ({
    default: () => null,
}));

vi.mock("./ToDoFilterButton", () => ({
    default: () => null,
}));

vi.mock("./AddButton", () => ({
    default: () => null,
}));

vi.mock("./TaskEditModal", () => ({
    default: () => null,
}));

vi.mock("./MessageConfirmation", () => ({
    default: () => null,
}));

vi.mock("./ToDoFilterModal", () => ({
    default: () => null,
}));

vi.mock("./RemindCard", () => ({
    default: ({ task, onDuplicate }) => (
        <button type="button" onClick={() => onDuplicate(task.id)}>
            Duplicar {task.name}
        </button>
    ),
}));

vi.mock("./TaskAddModal", () => ({
    default: ({ isOpen, onSave, task, title }) => {
        if (!isOpen) return null;

        return (
            <div data-testid="duplicate-modal">
                <p>{title}</p>
                <p data-testid="task-to-duplicate">{task?.name || ""}</p>
                <button type="button" onClick={() => onSave(nextDuplicatePayload)}>
                    Guardar duplicado
                </button>
            </div>
        );
    },
}));

vi.mock("../../services/reminderService", () => ({
    default: {
        getByUser: vi.fn(),
        addReminder: vi.fn(),
        updateState: vi.fn(),
        updateFromEdit: vi.fn(),
        deleteReminder: vi.fn(),
    },
}));

vi.mock("../../services/userService", () => ({
    getUserData: vi.fn(),
}));

describe("ToDoList - duplicado", () => {
    const baseTask = {
        id: 101,
        name: "Parcial Algebra",
        description: "Revisar capitulos 1 a 3",
        dueDate: "2026-03-31 10:00:00",
        priority: "alta",
        tags: [{ label: "estudio", type: "custom" }],
        completed: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        nextDuplicatePayload = {
            name: "Tarea duplicada",
            description: "Descripcion duplicada",
            dueDate: "2026-04-01 09:30:00",
            priority: "media",
            tags: [
                { label: "priority-high", type: "priority-high" },
                { label: "academico", type: "custom" },
                "personal",
            ],
        };

        ReminderService.getByUser.mockResolvedValue([baseTask]);
        ReminderService.addReminder.mockResolvedValue({ ok: true });
        getUserData.mockResolvedValue({ idUsuario: 777 });
    });

    it("abre modal de duplicado con la tarea seleccionada", async () => {
        const user = userEvent.setup();
        render(<ToDoList userId="7" />);

        await user.click(await screen.findByRole("button", { name: /Duplicar Parcial Algebra/i }));

        expect(screen.getByTestId("duplicate-modal")).toBeInTheDocument();
        expect(screen.getByText("Duplicar Tarea")).toBeInTheDocument();
        expect(screen.getByTestId("task-to-duplicate")).toHaveTextContent("Parcial Algebra");
    });

    it("seguridad: al guardar usa id interno y filtra tags synthetic priority-*", async () => {
        const user = userEvent.setup();
        render(<ToDoList userId="7" />);

        await user.click(await screen.findByRole("button", { name: /Duplicar Parcial Algebra/i }));
        await user.click(screen.getByRole("button", { name: /Guardar duplicado/i }));

        await waitFor(() => {
            expect(getUserData).toHaveBeenCalledWith("7");
            expect(ReminderService.addReminder).toHaveBeenCalledTimes(1);
        });

        expect(ReminderService.addReminder).toHaveBeenCalledWith(
            777,
            "Tarea duplicada",
            "Descripcion duplicada",
            "2026-04-01 09:30:00",
            "media",
            ["academico", "personal"],
            "7"
        );

        await waitFor(() => {
            expect(ReminderService.getByUser).toHaveBeenCalledTimes(2);
        });
    });

    it("recarga tareas aunque addReminder falle", async () => {
        const user = userEvent.setup();
        ReminderService.addReminder.mockRejectedValue(new Error("backend down"));

        render(<ToDoList userId="7" />);

        await user.click(await screen.findByRole("button", { name: /Duplicar Parcial Algebra/i }));
        await user.click(screen.getByRole("button", { name: /Guardar duplicado/i }));

        await waitFor(() => {
            expect(ReminderService.addReminder).toHaveBeenCalledTimes(1);
            expect(ReminderService.getByUser).toHaveBeenCalledTimes(2);
        });
    });
});