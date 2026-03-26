import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserPreferences from "./UserPreferences";
import * as userService from "../../services/userService";

vi.mock("../../services/userService", () => ({
    getUserData: vi.fn(),
    updateUserEmail: vi.fn(),
    updateReminderAnticipation: vi.fn(),
}));

function createUserData(overrides = {}) {
    return {
        idUsuario: 123,
        correo: "estudiante@upb.edu",
        antelacionNotis: "01:30:00",
        ...overrides,
    };
}

describe("UserPreferences - edicion de perfil", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        userService.getUserData.mockResolvedValue(createUserData());
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    async function renderComponent() {
        render(<UserPreferences userId={123} onClose={() => {}} />);
        await screen.findByRole("heading", { name: /Correo Electr.nico/i });
    }

    it("renderiza secciones principales y datos iniciales", async () => {
        await renderComponent();

        expect(screen.getByRole("heading", { name: /Correo Electr.nico/i })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: /Notificaciones/i })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: /Recordatorios/i })).toBeInTheDocument();
        expect(screen.getByText("estudiante@upb.edu")).toBeInTheDocument();
        expect(screen.getByText("1h 30m")).toBeInTheDocument();
    });

    it("muestra error cuando no hay userId", async () => {
        render(<UserPreferences userId={null} onClose={() => {}} />);

        expect(await screen.findByText(/Usuario no disponible/i)).toBeInTheDocument();
        expect(userService.getUserData).not.toHaveBeenCalled();
    });

    it("entra en modo edicion de correo", async () => {
        const user = userEvent.setup();
        await renderComponent();

        await user.click(screen.getByRole("button", { name: /Editar correo/i }));

        expect(screen.getByPlaceholderText("nuevo.email@upb.edu")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Guardar/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Cancelar/i })).toBeInTheDocument();
    });

    it("valida correo vacio y no llama al servicio", async () => {
        const user = userEvent.setup();
        await renderComponent();

        await user.click(screen.getByRole("button", { name: /Editar correo/i }));
        const input = screen.getByPlaceholderText("nuevo.email@upb.edu");
        await user.clear(input);
        await user.click(screen.getByRole("button", { name: /Guardar/i }));

        expect(userService.updateUserEmail).not.toHaveBeenCalled();
        expect(screen.getByText(/Por favor ingresa un correo electr.nico/i)).toBeInTheDocument();
    });

    it("valida formato de correo y no llama al servicio", async () => {
        const user = userEvent.setup();
        await renderComponent();

        await user.click(screen.getByRole("button", { name: /Editar correo/i }));
        const input = screen.getByPlaceholderText("nuevo.email@upb.edu");
        await user.clear(input);
        await user.type(input, "correo@invalido");
        await user.click(screen.getByRole("button", { name: /Guardar/i }));

        expect(userService.updateUserEmail).not.toHaveBeenCalled();
        expect(screen.getByText(/Por favor ingresa un correo electr.nico v.lido/i)).toBeInTheDocument();
    });

    it("valida correo sin cambios y no llama al servicio", async () => {
        const user = userEvent.setup();
        await renderComponent();

        await user.click(screen.getByRole("button", { name: /Editar correo/i }));
        await user.click(screen.getByRole("button", { name: /Guardar/i }));

        expect(userService.updateUserEmail).not.toHaveBeenCalled();
        expect(screen.getByText(/El correo nuevo debe ser diferente al actual/i)).toBeInTheDocument();
    });

    it("guarda correo exitosamente y actualiza la vista", async () => {
        userService.updateUserEmail.mockResolvedValue({ success: true });

        const user = userEvent.setup();
        await renderComponent();

        await user.click(screen.getByRole("button", { name: /Editar correo/i }));
        const input = screen.getByPlaceholderText("nuevo.email@upb.edu");
        await user.clear(input);
        await user.type(input, "  nuevo@upb.edu  ");
        await user.click(screen.getByRole("button", { name: /Guardar/i }));

        await waitFor(() => {
            expect(userService.updateUserEmail).toHaveBeenCalledWith(123, "nuevo@upb.edu");
        });

        expect(await screen.findByText(/Correo actualizado exitosamente/i)).toBeInTheDocument();
        expect(screen.getByText("nuevo@upb.edu")).toBeInTheDocument();
        expect(screen.queryByPlaceholderText("nuevo.email@upb.edu")).not.toBeInTheDocument();
    });

    it("muestra error cuando falla guardar correo", async () => {
        userService.updateUserEmail.mockResolvedValue({ success: false, message: "Fallo backend" });

        const user = userEvent.setup();
        await renderComponent();

        await user.click(screen.getByRole("button", { name: /Editar correo/i }));
        const input = screen.getByPlaceholderText("nuevo.email@upb.edu");
        await user.clear(input);
        await user.type(input, "nuevo@upb.edu");
        await user.click(screen.getByRole("button", { name: /Guardar/i }));

        expect(await screen.findByText("Fallo backend")).toBeInTheDocument();
    });

    it("cancela edicion de correo y restaura valor inicial", async () => {
        const user = userEvent.setup();
        await renderComponent();

        await user.click(screen.getByRole("button", { name: /Editar correo/i }));
        const input = screen.getByPlaceholderText("nuevo.email@upb.edu");
        await user.clear(input);
        await user.type(input, "nuevo@upb.edu");
        await user.click(screen.getByRole("button", { name: /Cancelar/i }));

        expect(screen.queryByPlaceholderText("nuevo.email@upb.edu")).not.toBeInTheDocument();
        expect(screen.getByText("estudiante@upb.edu")).toBeInTheDocument();
        expect(userService.updateUserEmail).not.toHaveBeenCalled();
    });

    it("valida anticipacion sin cambios y no llama al servicio", async () => {
        const user = userEvent.setup();
        await renderComponent();

        await user.click(screen.getByRole("button", { name: /Editar tiempo de anticipaci.n/i }));
        await user.click(screen.getByRole("button", { name: /Guardar/i }));

        expect(userService.updateReminderAnticipation).not.toHaveBeenCalled();
        expect(screen.getByText(/El nuevo tiempo debe ser diferente al actual/i)).toBeInTheDocument();
    });

    it("guarda anticipacion exitosamente enviando minutos totales", async () => {
        userService.updateReminderAnticipation.mockResolvedValue({ success: true });

        const user = userEvent.setup();
        await renderComponent();

        await user.click(screen.getByRole("button", { name: /Editar tiempo de anticipaci.n/i }));

        await user.selectOptions(screen.getByLabelText(/^Horas$/i), "2");
        await user.selectOptions(screen.getByLabelText(/^Minutos$/i), "15");
        await user.click(screen.getByRole("button", { name: /Guardar/i }));

        await waitFor(() => {
            expect(userService.updateReminderAnticipation).toHaveBeenCalledWith(123, 135);
        });

        expect(await screen.findByText(/Tiempo de anticipaci.n actualizado exitosamente/i)).toBeInTheDocument();
        expect(screen.getByText("2h 15m")).toBeInTheDocument();
    });

    it("mantiene deshabilitado guardar de silenciado hasta elegir duracion", async () => {
        const user = userEvent.setup();
        await renderComponent();

        await user.click(screen.getByRole("button", { name: /Silenciar Notificaciones/i }));

        expect(screen.getByRole("button", { name: /Guardar/i })).toBeDisabled();
    });

    it("silencia y reactiva notificaciones usando localStorage", async () => {
        vi.spyOn(Date, "now").mockReturnValue(1000);
        const user = userEvent.setup();
        await renderComponent();

        await user.click(screen.getByRole("button", { name: /Silenciar Notificaciones/i }));
        await user.click(screen.getByRole("button", { name: /^8 h$/i }));
        await user.click(screen.getByRole("button", { name: /Guardar/i }));

        expect(await screen.findByText(/Notificaciones silenciadas correctamente/i)).toBeInTheDocument();
        expect(screen.getByText(/^Silenciadas$/i)).toBeInTheDocument();

        const stored = JSON.parse(localStorage.getItem("notificationsMute"));
        expect(stored).toMatchObject({
            enabled: true,
            hours: 8,
            minutes: 0,
            totalMinutes: 480,
            userId: 123,
        });

        await user.click(screen.getByRole("button", { name: /Reactivar notificaciones/i }));

        expect(localStorage.getItem("notificationsMute")).toBeNull();
        expect(await screen.findByText(/Notificaciones reactivadas/i)).toBeInTheDocument();
    });

    it("deshabilita controles de correo mientras guarda", async () => {
        let resolveRequest;
        userService.updateUserEmail.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveRequest = resolve;
                })
        );

        const user = userEvent.setup();
        await renderComponent();

        await user.click(screen.getByRole("button", { name: /Editar correo/i }));
        const input = screen.getByPlaceholderText("nuevo.email@upb.edu");
        await user.clear(input);
        await user.type(input, "nuevo@upb.edu");
        await user.click(screen.getByRole("button", { name: /Guardar/i }));

        expect(input).toBeDisabled();
        expect(screen.getByRole("button", { name: /Guardar/i })).toBeDisabled();
        expect(screen.getByRole("button", { name: /Cancelar/i })).toBeDisabled();

        resolveRequest({ success: true });

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /Editar correo/i })).toBeEnabled();
        });
    });

    it("programa limpieza de mensaje de exito a 3 segundos", async () => {
        const timeoutSpy = vi.spyOn(globalThis, "setTimeout");
        userService.updateUserEmail.mockResolvedValue({ success: true });

        const user = userEvent.setup();
        await renderComponent();

        await user.click(screen.getByRole("button", { name: /Editar correo/i }));
        const input = screen.getByPlaceholderText("nuevo.email@upb.edu");
        await user.clear(input);
        await user.type(input, "nuevo@upb.edu");
        await user.click(screen.getByRole("button", { name: /Guardar/i }));

        expect(await screen.findByText(/Correo actualizado exitosamente/i)).toBeInTheDocument();
        expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 3000);
    });
});
