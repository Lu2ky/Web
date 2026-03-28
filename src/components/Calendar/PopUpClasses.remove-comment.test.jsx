import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PopUpClasses } from "./PopUpClasses";
import fetchComments from "../../services/commentFetcher";
import deleteComment from "../../services/removeComentService";

vi.mock("../../services/commentFetcher", () => ({
    default: vi.fn(),
}));

vi.mock("../../services/addComentService", () => ({
    default: vi.fn(),
}));

vi.mock("../../services/removeComentService", () => ({
    default: vi.fn(),
}));

function createClassData(overrides = {}) {
    return {
        id: 45,
        nrc: "12345",
        subject_name: "Calculo I",
        apiData: {
            N_idCurso: 45,
            N_idHorario: 999,
        },
        ...overrides,
    };
}

function createInitialComments() {
    return [
        { id: 1, text: "Comentario 1", timestamp: "Hoy" },
        { id: 2, text: "Comentario 2", timestamp: "Ayer" },
    ];
}

function createDeferred() {
    let resolve;
    let reject;

    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });

    return { promise, resolve, reject };
}

describe("PopUpClasses - eliminar comentario", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    async function renderComponent() {
        render(
            <PopUpClasses
                isOpen
                userId={123}
                classData={createClassData()}
                onClose={() => {}}
            />
        );

        await screen.findByRole("heading", { name: /Detalle de Asignatura/i });
    }

    it("elimina comentario de forma optimista y llama al servicio", async () => {
        fetchComments.mockResolvedValue(createInitialComments());
        fetchComments
            .mockResolvedValueOnce(createInitialComments())
            .mockResolvedValueOnce(createInitialComments())
            .mockResolvedValue([{ id: 2, text: "Comentario 2", timestamp: "Ayer" }]);
        deleteComment.mockResolvedValue({ success: true });

        const user = userEvent.setup();
        await renderComponent();

        await screen.findByText("Comentario 1");

        const commentCard = screen.getByText("Comentario 1").closest(".comment-item");
        expect(commentCard).not.toBeNull();
        await user.click(within(commentCard).getByRole("button", { name: /Eliminar comentario/i }));

        await waitFor(() => {
            expect(deleteComment).toHaveBeenCalledWith(1);
        });

        await waitFor(() => {
            expect(screen.queryByText("Comentario 1")).not.toBeInTheDocument();
        });
    });

    it("restaura comentario cuando falla la eliminacion", async () => {
        fetchComments
            .mockResolvedValue(createInitialComments())
            .mockResolvedValueOnce(createInitialComments())
            .mockResolvedValueOnce(createInitialComments());
        deleteComment.mockRejectedValue(new Error("fallo delete"));

        const user = userEvent.setup();
        await renderComponent();

        await screen.findByText("Comentario 1");

        const commentCard = screen.getByText("Comentario 1").closest(".comment-item");
        expect(commentCard).not.toBeNull();
        await user.click(within(commentCard).getByRole("button", { name: /Eliminar comentario/i }));

        await waitFor(() => {
            expect(deleteComment).toHaveBeenCalledWith(1);
        });

        await waitFor(() => {
            expect(screen.getByText("Comentario 1")).toBeInTheDocument();
        });
    });

    it("bloquea una segunda eliminacion mientras hay una en curso", async () => {
        const deferred = createDeferred();

        fetchComments
            .mockResolvedValue(createInitialComments())
            .mockResolvedValueOnce(createInitialComments())
            .mockResolvedValueOnce(createInitialComments());
        deleteComment.mockReturnValue(deferred.promise);

        const user = userEvent.setup();
        await renderComponent();

        await screen.findByText("Comentario 1");

        const firstCard = screen.getByText("Comentario 1").closest(".comment-item");
        const secondCard = screen.getByText("Comentario 2").closest(".comment-item");
        expect(firstCard).not.toBeNull();
        expect(secondCard).not.toBeNull();

        await user.click(within(firstCard).getByRole("button", { name: /Eliminar comentario/i }));

        await waitFor(() => {
            expect(deleteComment).toHaveBeenCalledTimes(1);
            expect(deleteComment).toHaveBeenCalledWith(1);
            expect(within(secondCard).getByRole("button", { name: /Eliminar comentario/i })).toBeDisabled();
        });

        await user.click(within(secondCard).getByRole("button", { name: /Eliminar comentario/i }));

        expect(deleteComment).toHaveBeenCalledTimes(1);

        deferred.resolve({ success: true });

        await waitFor(() => {
            expect(within(secondCard).getByRole("button", { name: /Eliminar comentario/i })).toBeEnabled();
        });
    });
});
