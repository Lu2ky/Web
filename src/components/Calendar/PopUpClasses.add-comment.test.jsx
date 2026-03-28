import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PopUpClasses } from "./PopUpClasses";
import fetchComments from "../../services/commentFetcher";
import addComment from "../../services/addComentService";

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

function createDeferred() {
    let resolve;
    let reject;

    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });

    return { promise, resolve, reject };
}

describe("PopUpClasses - anadir comentario", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(console, "debug").mockImplementation(() => {});
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

    it("agrega comentario y envia payload esperado", async () => {
        fetchComments.mockResolvedValue([{ id: 101, text: "Comentario nuevo", timestamp: "Ahora" }]);
        fetchComments
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([{ id: 101, text: "Comentario nuevo", timestamp: "Ahora" }]);
        addComment.mockResolvedValue({ success: true });

        const user = userEvent.setup();
        await renderComponent();

        await user.click(screen.getByRole("button", { name: /Agregar Comentario/i }));
        await user.type(screen.getByPlaceholderText(/Escribe tu comentario/i), "Comentario nuevo");
        await user.click(screen.getByRole("button", { name: /Guardar comentario/i }));

        await waitFor(() => {
            expect(addComment).toHaveBeenCalledWith({
                scheduleId: 999,
                userId: 123,
                courseId: 45,
                courseName: "Calculo I",
                comment: "Comentario nuevo",
            });
        });

        expect(await screen.findByText("Comentario nuevo", { selector: ".comment-text" })).toBeInTheDocument();
    });

    it("hace rollback cuando falla al anadir comentario", async () => {
        fetchComments.mockResolvedValue([]);
        addComment.mockRejectedValue(new Error("fallo add"));

        const user = userEvent.setup();
        await renderComponent();

        await user.click(screen.getByRole("button", { name: /Agregar Comentario/i }));
        await user.type(screen.getByPlaceholderText(/Escribe tu comentario/i), "Comentario con error");
        await user.click(screen.getByRole("button", { name: /Guardar comentario/i }));

        await waitFor(() => {
            expect(addComment).toHaveBeenCalledTimes(1);
        });

        await waitFor(() => {
            expect(screen.queryByText("Comentario con error", { selector: ".comment-text" })).not.toBeInTheDocument();
        });
    });

    it("deshabilita acciones mientras se esta guardando comentario", async () => {
        const deferred = createDeferred();

        fetchComments
            .mockResolvedValueOnce([])
            .mockResolvedValue([{ id: 201, text: "Comentario pendiente", timestamp: "Ahora" }]);
        addComment.mockReturnValue(deferred.promise);

        const user = userEvent.setup();
        await renderComponent();

        await user.click(screen.getByRole("button", { name: /Agregar Comentario/i }));
        await user.type(screen.getByPlaceholderText(/Escribe tu comentario/i), "Comentario pendiente");
        await user.click(screen.getByRole("button", { name: /Guardar comentario/i }));

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /Agregar Comentario/i })).toBeDisabled();
            expect(screen.getByRole("button", { name: /Guardar comentario/i })).toBeDisabled();
        });

        deferred.resolve({ success: true });

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /Agregar Comentario/i })).toBeEnabled();
        });
    });
});
